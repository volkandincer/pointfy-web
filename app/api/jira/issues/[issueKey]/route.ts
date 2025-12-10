import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import type {
  JiraIssue,
  JiraTask,
  JiraApiErrorResponse,
  JiraAdfDocument,
  JiraAdfNode,
} from "@/interfaces/Jira.interface";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Tek bir Jira issue detayını getir
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ issueKey: string }> | { issueKey: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    // Next.js 15'te params bir Promise olabilir
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

    if (!issueKey || issueKey === "undefined" || issueKey === "null" || issueKey.trim() === "") {
      return NextResponse.json(
        { error: "Issue key is required" },
        { status: 400 }
      );
    }

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

    // Token'ın geçerliliğini kontrol et ve refresh et (gerekirse)
    let jiraToken = userRow.jira_access_token;
    const tokenExpiresAt = userRow.jira_token_expires_at
      ? new Date(userRow.jira_token_expires_at)
      : null;

    const shouldRefresh =
      tokenExpiresAt && tokenExpiresAt <= new Date();

    if (shouldRefresh) {
      if (!userRow.jira_refresh_token) {
        return NextResponse.json(
          { error: "Jira token expired and no refresh token available" },
          { status: 401 }
        );
      }

      try {
        const refreshResponse = await fetch("https://auth.atlassian.com/oauth/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            grant_type: "refresh_token",
            client_id: jiraClientId,
            client_secret: jiraClientSecret,
            refresh_token: userRow.jira_refresh_token,
          }),
        });

        if (!refreshResponse.ok) {
          throw new Error("Failed to refresh token");
        }

        const refreshData = await refreshResponse.json();
        jiraToken = refreshData.access_token;

        // Yeni token'ı veritabanına kaydet
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + (refreshData.expires_in || 3600));

        await supabase
          .from("users")
          .update({
            jira_access_token: refreshData.access_token,
            jira_refresh_token: refreshData.refresh_token || userRow.jira_refresh_token,
            jira_token_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);
      } catch (refreshError) {
        return NextResponse.json(
          { error: "Failed to refresh Jira token" },
          { status: 401 }
        );
      }
    }

    // Jira base URL ve cloud ID'yi al (query param'dan veya veritabanından)
    const queryJiraBaseUrl = searchParams.get("jiraBaseUrl");
    const jiraBaseUrl = queryJiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl;
    let apiUrl = "";
    let cloudId: string | null = null;

    // Cloud Jira kontrolü - atlassian.com veya atlassian.net içeriyorsa cloud
    const isCloudJira = jiraBaseUrl && (
      jiraBaseUrl.includes("atlassian.com") || 
      jiraBaseUrl.includes("atlassian.net")
    );

    if (isCloudJira) {
      // Cloud Jira - accessible resources'dan cloud ID al
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
          
          // Jira resource'unu bul (atlassian.net içeren veya jira içeren)
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
            // Fallback: İlk resource'u kullan
            cloudId = resources[0].id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          }
        }
      } catch (error) {
        // Cloud ID fetch error
      }
    }

    // Eğer cloud ID alınamadıysa ve jiraBaseUrl varsa, direkt URL kullan
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
        { 
          error: "Jira base URL not configured",
          details: {
            queryJiraBaseUrl: queryJiraBaseUrl || null,
            userRowJiraBaseUrl: userRow.jira_base_url || null,
            fallbackJiraBaseUrl: fallbackJiraBaseUrl || null,
            cloudId: cloudId || null,
          }
        },
        { status: 400 }
      );
    }

    // Issue detayını getir
    const issueEndpoint = `${apiUrl}/rest/api/3/issue/${issueKey}`;
    const response = await fetch(issueEndpoint, {
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
      },
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
        `Failed to fetch issue: ${response.status} ${response.statusText}`;

      return NextResponse.json(
        { error: formatErrorMessage(errorMessage) },
        { status: response.status }
      );
    }

    const issue: JiraIssue = await response.json();

    // Description'ı extract et
    const extractDescription = (description: JiraAdfDocument | string | undefined): string => {
      if (!description) return "";
      if (typeof description === "string") return description;

      const extractText = (node: JiraAdfNode): string => {
        if (node.text) return node.text;
        if (node.content) {
          return node.content.map(extractText).join("");
        }
        return "";
      };

      if (description.content) {
        return description.content.map(extractText).join("\n");
      }
      return "";
    };

    // Jira base URL'i URL için hazırla
    const jiraBaseUrlForUrl = jiraBaseUrl || fallbackJiraBaseUrl;
    let baseUrlForUrl = "";
    if (cloudId) {
      baseUrlForUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
    } else if (jiraBaseUrlForUrl) {
      let url = jiraBaseUrlForUrl;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      baseUrlForUrl = url;
    } else {
      baseUrlForUrl = apiUrl;
    }

    // JiraTask formatına çevir
    const task: JiraTask = {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: extractDescription(issue.fields.description as JiraAdfDocument | string | undefined),
      status: issue.fields.status.name,
      statusColor: issue.fields.status.statusCategory.colorName,
      assignee: issue.fields.assignee
        ? {
            name: issue.fields.assignee.displayName,
            avatar: issue.fields.assignee.avatarUrls["48x48"],
            accountId: issue.fields.assignee.accountId,
          }
        : undefined,
      priority: issue.fields.priority?.name,
      type: issue.fields.issuetype.name,
      project: {
        key: issue.fields.project.key,
        name: issue.fields.project.name,
      },
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolved: issue.fields.resolutiondate,
      url: jiraBaseUrlForUrl
        ? `https://${jiraBaseUrlForUrl.replace(/^https?:\/\//, "")}/browse/${issue.key}`
        : cloudId
        ? `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`
        : `${baseUrlForUrl}/browse/${issue.key}`,
    };

    return NextResponse.json({ issue: task });
  } catch (error) {
    return NextResponse.json(
      { error: formatErrorMessage(error) },
      { status: 500 }
    );
  }
}

