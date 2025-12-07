import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import { resolveEnvValue } from "@/lib/appEnvironment";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

const isJiraApiErrorResponse = (value: unknown): value is JiraApiErrorResponse =>
  typeof value === "object" && value !== null;

async function getJiraApiDetails(userId: string, jiraBaseUrlFromQuery?: string | null) {
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
    throw new Error("Jira bağlantısı gerekli");
  }

  let jiraToken = userRow.jira_access_token;
  const tokenExpiresAt = userRow.jira_token_expires_at
    ? new Date(userRow.jira_token_expires_at)
    : null;

  const shouldRefresh = tokenExpiresAt && tokenExpiresAt <= new Date();

  if (shouldRefresh) {
    if (!userRow.jira_refresh_token) {
      throw new Error("Jira token expired. Please reconnect Jira.");
    }

    if (!jiraClientId || !jiraClientSecret) {
      throw new Error("Jira OAuth configuration missing");
    }

    const { refreshJiraToken } = await import("@/lib/jira");
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
  }

  const jiraBaseUrl = jiraBaseUrlFromQuery || userRow.jira_base_url || fallbackJiraBaseUrl;
  let apiUrl = "";
  let cloudId: string | null = null;

  const isCloudJira = jiraBaseUrl && (jiraBaseUrl.includes("atlassian.com") || jiraBaseUrl.includes("atlassian.net"));

  if (isCloudJira) {
    const resourcesResponse = await fetch(
      "https://api.atlassian.com/oauth/token/accessible-resources",
      {
        headers: { Authorization: `Bearer ${jiraToken}`, Accept: "application/json" },
      }
    );

    if (resourcesResponse.ok) {
      const resources: Array<{ id: string; url: string; name: string }> = await resourcesResponse.json();
      const jiraResource = resources.find((r) => r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira"));
      if (jiraResource) {
        cloudId = jiraResource.id;
        apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
      } else if (resources.length > 0) {
        cloudId = resources[0].id;
        apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
      }
    }
  }

  if (!apiUrl && jiraBaseUrl) {
    let url = jiraBaseUrl;
    if (!url.startsWith("http")) url = `https://${url}`;
    if (url.endsWith("/")) url = url.slice(0, -1);
    apiUrl = url;
  }

  if (!apiUrl) {
    throw new Error("Jira base URL not configured");
  }

  return { jiraToken, apiUrl, cloudId };
}

async function getUserIdFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("sb-access-token")?.value;
  if (accessToken) {
    try {
      const tokenParts = accessToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
        return payload.sub;
      }
    } catch (error) {
      // JWT decode başarısız
    }
  }
  return undefined;
}

/**
 * Proje için mevcut issue type'ları getir
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectKey: string }> | { projectKey: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const resolvedParams = await Promise.resolve(params);
    const projectKey = resolvedParams?.projectKey;
    let userId: string | undefined = searchParams.get("userId") || undefined;

    if (!userId) userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized: Please log in first" }, { status: 401 });
    if (!projectKey) return NextResponse.json({ error: "Project key is required" }, { status: 400 });

    const { jiraToken, apiUrl } = await getJiraApiDetails(userId, searchParams.get("jiraBaseUrl"));

    // Proje metadata'sını getir (issue type'lar dahil)
    const projectEndpoint = `${apiUrl}/rest/api/3/project/${projectKey}`;
    const response = await fetch(projectEndpoint, {
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
      } catch { /* empty */ }
      const errorMessage = errorData?.errorMessages?.[0] || errorData?.error || errorData?.message || `Failed to fetch project: ${response.status} ${response.statusText}`;
      return NextResponse.json({ error: errorMessage, details: errorText }, { status: response.status });
    }

    const projectData = await response.json();
    
    // Issue type'ları formatla ve sub-task'ları filtrele
    const issueTypes = (projectData.issueTypes || [])
      .filter((type: { id: string; name: string; description?: string; iconUrl?: string; subtask?: boolean }) => {
        // Sub-task'ları filtrele:
        // 1. subtask field'ı true ise
        // 2. name'i "Sub-task", "Subtask", "Sub-task" içeriyorsa
        const nameLower = (type.name || "").toLowerCase();
        const isSubtask = 
          type.subtask === true || 
          nameLower.includes("sub-task") || 
          nameLower.includes("subtask") ||
          nameLower === "alt görev";
        
        return !isSubtask;
      })
      .map((type: { id: string; name: string; description?: string; iconUrl?: string }) => ({
        id: type.id,
        name: type.name,
        description: type.description || "",
        iconUrl: type.iconUrl || "",
      }));

    return NextResponse.json({ issueTypes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

