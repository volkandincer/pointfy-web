import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";
import { resolveEnvValue } from "@/lib/appEnvironment";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Jira issue'u bir kullanıcıya ata
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ issueKey: string }> | { issueKey: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const resolvedParams = await Promise.resolve(params);
    const issueKey = resolvedParams?.issueKey;
    let userId: string | undefined = searchParams.get("userId") || undefined;

    // Cookie'den user ID al
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("sb-access-token")?.value;

        if (accessToken) {
          try {
            const tokenParts = accessToken.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(
                Buffer.from(tokenParts[1], "base64").toString()
              );
              userId = payload.sub;
            }
          } catch (error) {
            // JWT decode başarısız
          }
        }
      } catch (authError) {
        // Auth error
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first" },
        { status: 401 }
      );
    }

    if (!issueKey) {
      return NextResponse.json(
        { error: "Issue key is required" },
        { status: 400 }
      );
    }

    // Request body'den assignee accountId al
    const body = await request.json();
    const { accountId: assigneeAccountId, jiraBaseUrl: bodyJiraBaseUrl } = body;

    // Jira token'ı al
    let supabase;
    try {
      supabase = getSupabaseServer();
    } catch {
      supabase = getSupabase();
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("jira_access_token, jira_refresh_token, jira_token_expires_at, jira_base_url")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !userRow || !userRow.jira_access_token) {
      return NextResponse.json(
        { error: "Jira bağlantısı gerekli" },
        { status: 400 }
      );
    }

    // Token refresh kontrolü
    let jiraToken = userRow.jira_access_token;
    const tokenExpiresAt = userRow.jira_token_expires_at
      ? new Date(userRow.jira_token_expires_at)
      : null;

    const shouldRefresh =
      tokenExpiresAt && tokenExpiresAt <= new Date();

    if (shouldRefresh) {
      if (!userRow.jira_refresh_token) {
        return NextResponse.json(
          { error: "Jira token expired. Please reconnect Jira." },
          { status: 401 }
        );
      }

      try {
        const { refreshJiraToken } = await import("@/lib/jira");

        if (!jiraClientId || !jiraClientSecret) {
          return NextResponse.json(
            { error: "Jira OAuth configuration missing" },
            { status: 500 }
          );
        }

        const refreshed = await refreshJiraToken(
          userRow.jira_refresh_token,
          jiraClientId,
          jiraClientSecret
        );

        jiraToken = refreshed.access_token;

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);

        await supabase
          .from("users")
          .update({
            jira_access_token: refreshed.access_token,
            jira_refresh_token: refreshed.refresh_token || userRow.jira_refresh_token,
            jira_token_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);
      } catch (refreshError) {
        return NextResponse.json(
          { error: "Jira token expired and refresh failed. Please reconnect Jira." },
          { status: 401 }
        );
      }
    }

    // Jira base URL ve cloud ID'yi al
    const queryJiraBaseUrl = searchParams.get("jiraBaseUrl");
    const jiraBaseUrl = bodyJiraBaseUrl || queryJiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl;
    let apiUrl = "";
    let cloudId: string | null = null;

    const isCloudJira = jiraBaseUrl && (
      jiraBaseUrl.includes("atlassian.com") || 
      jiraBaseUrl.includes("atlassian.net")
    );

    if (isCloudJira) {
      try {
        const resourcesResponse = await fetch(
          "https://api.atlassian.com/oauth/token/accessible-resources",
          {
            headers: {
              Authorization: `Bearer ${jiraToken}`,
              Accept: "application/json",
            },
          }
        );

        if (resourcesResponse.ok) {
          const resources: Array<{ id: string; name?: string; url: string }> =
            await resourcesResponse.json();
          
          const jiraResource = resources.find(
            (r) =>
              r.url.includes("atlassian.net") || 
              r.url.includes("atlassian.com") ||
              r.name?.toLowerCase().includes("jira")
          );

          if (jiraResource) {
            cloudId = jiraResource.id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          } else if (resources.length > 0) {
            cloudId = resources[0].id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          }
        }
      } catch (error) {
        // Cloud ID fetch error
      }
    }

    if (!apiUrl && jiraBaseUrl) {
      let url = jiraBaseUrl;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      apiUrl = url;
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Jira base URL not configured" },
        { status: 400 }
      );
    }

    // Issue'u güncelle - assignee'yi set et
    const issueEndpoint = `${apiUrl}/rest/api/3/issue/${issueKey}`;
    const updateBody: { fields: { assignee?: { accountId: string } | null } } = {
      fields: {},
    };

    if (assigneeAccountId) {
      updateBody.fields.assignee = { accountId: assigneeAccountId };
    } else {
      // Unassign için null gönder
      updateBody.fields.assignee = null;
    }

    const response = await fetch(issueEndpoint, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: JiraApiErrorResponse | null = null;
      try {
        errorData = JSON.parse(errorText) as JiraApiErrorResponse;
      } catch {
        // Parse error
      }

      const errorMessage =
        errorData?.errorMessages?.[0] ||
        errorData?.error ||
        errorData?.message ||
        `Failed to assign issue: ${response.status} ${response.statusText}`;

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: assigneeAccountId ? "Issue başarıyla atandı" : "Issue ataması kaldırıldı",
      issueKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

