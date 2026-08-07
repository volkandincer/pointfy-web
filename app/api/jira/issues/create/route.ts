import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { logger } from "@/lib/logger";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  return { jiraToken, apiUrl, cloudId, jiraBaseUrl };
}

/**
 * Jira'da yeni issue oluştur
 */
export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromRequest(request);

    if (!userId) return NextResponse.json({ error: "Unauthorized: Please log in first" }, { status: 401 });

    const body = await request.json();
    const { projectKey, issueTypeId, summary, description, jiraBaseUrl: bodyJiraBaseUrl } = body;

    if (!projectKey || !issueTypeId || !summary || !summary.trim()) {
      return NextResponse.json(
        { error: "projectKey, issueTypeId, and summary are required" },
        { status: 400 }
      );
    }

    const { jiraToken, apiUrl, cloudId, jiraBaseUrl } = await getJiraApiDetails(userId, bodyJiraBaseUrl);

    // Issue type'ın sub-task olup olmadığını kontrol et
    try {
      const issueTypeEndpoint = `${apiUrl}/rest/api/3/issuetype/${issueTypeId}`;
      const issueTypeResponse = await fetch(issueTypeEndpoint, {
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          Accept: "application/json",
        },
      });

      if (issueTypeResponse.ok) {
        const issueTypeData = await issueTypeResponse.json();
        const isSubtask = issueTypeData.subtask === true || 
                         (issueTypeData.name || "").toLowerCase().includes("sub-task") ||
                         (issueTypeData.name || "").toLowerCase().includes("subtask");
        
        if (isSubtask) {
          return NextResponse.json(
            { error: "Sub-task issue type'ları desteklenmiyor. Lütfen normal bir issue type seçin." },
            { status: 400 }
          );
        }
      }
    } catch (typeCheckError) {
      // Issue type kontrolü başarısız olursa devam et (belki API farklıdır)
      logger.warn("Issue type kontrolü başarısız:", typeCheckError);
    }

    // Issue oluştur (ADF formatında description)
    const issueBody: {
      fields: {
        project: { key: string };
        summary: string;
        description?: {
          type: string;
          version: number;
          content: Array<{
            type: string;
            content: Array<{ type: string; text: string }>;
          }>;
        };
        issuetype: { id: string };
      };
    } = {
      fields: {
        project: { key: projectKey },
        summary: summary.trim(),
        issuetype: { id: issueTypeId },
      },
    };

    // Description varsa ADF formatında ekle
    if (description && description.trim()) {
      issueBody.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: description.trim(),
              },
            ],
          },
        ],
      };
    }

    const createEndpoint = `${apiUrl}/rest/api/3/issue`;
    const response = await fetch(createEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(issueBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: JiraApiErrorResponse | null = null;
      try {
        errorData = JSON.parse(errorText) as JiraApiErrorResponse;
      } catch { /* empty */ }
      const errorMessage = errorData?.errorMessages?.[0] || errorData?.error || errorData?.message || `Failed to create issue: ${response.status} ${response.statusText}`;
      return NextResponse.json({ error: formatErrorMessage(errorMessage) }, { status: response.status });
    }

    const newIssue = await response.json();
    
    // Issue URL'ini oluştur
    let issueUrl = "";
    if (cloudId) {
      issueUrl = `https://api.atlassian.com/ex/jira/${cloudId}/browse/${newIssue.key}`;
    } else if (jiraBaseUrl) {
      const baseUrl = jiraBaseUrl.startsWith("http") ? jiraBaseUrl : `https://${jiraBaseUrl}`;
      issueUrl = `${baseUrl.replace(/\/$/, "")}/browse/${newIssue.key}`;
    } else {
      issueUrl = `${apiUrl}/browse/${newIssue.key}`;
    }

    return NextResponse.json({
      success: true,
      issue: {
        id: newIssue.id,
        key: newIssue.key,
        self: newIssue.self,
        url: issueUrl,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatErrorMessage(error) },
      { status: 500 }
    );
  }
}

