import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { jiraConfig } from "@/lib/jiraConfig";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import type { JiraApiErrorResponse, JiraTask, JiraAdfDocument, JiraAdfNode } from "@/interfaces/Jira.interface";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const isJiraApiErrorResponse = (value: unknown): value is JiraApiErrorResponse =>
  typeof value === "object" && value !== null;

/**
 * Jira priority'yi PersonalTask priority'ye çevir
 */
function mapJiraPriorityToPersonalTaskPriority(jiraPriority?: string): number {
  if (!jiraPriority) return 1; // Default: Düşük

  const lowerPriority = jiraPriority.toLowerCase();

  if (lowerPriority.includes("highest") || lowerPriority.includes("critical") || lowerPriority.includes("blocker")) {
    return 3; // Yüksek
  }
  if (lowerPriority.includes("high") || lowerPriority.includes("major")) {
    return 2; // Orta
  }
  if (lowerPriority.includes("medium") || lowerPriority.includes("normal")) {
    return 2; // Orta
  }
  if (lowerPriority.includes("low") || lowerPriority.includes("minor")) {
    return 1; // Düşük
  }
  if (lowerPriority.includes("lowest") || lowerPriority.includes("trivial")) {
    return 1; // Düşük
  }

  return 1; // Default: Düşük
}

/**
 * Jira description'ı string'e çevir (ADF format için)
 */
function extractDescription(description: JiraAdfDocument | string | undefined): string | null {
  if (!description) return null;
  if (typeof description === "string") return description;

  const extractText = (node: JiraAdfNode): string => {
    const currentText = node.text ?? "";
    if (node.content && Array.isArray(node.content)) {
      return currentText + node.content.map(extractText).join("");
    }
    return currentText;
  };

  if (description.content && Array.isArray(description.content)) {
    const combined = description.content.map(extractText).join(" ").trim();
    return combined || null;
  }

  return null;
}

/**
 * JiraTask'ı PersonalTask formatına çevir
 */
function convertJiraTaskToPersonalTask(
  jiraTask: JiraTask,
  userId: string,
  jiraBaseUrl: string
): {
  user_key: string;
  title: string;
  description: string | null;
  category: string;
  priority: number;
  jira_issue_key: string;
  jira_issue_url: string;
} {
  // JiraTask.description zaten string | undefined olabilir, ama API'den gelen raw data ADF formatında olabilir
  const description = typeof jiraTask.description === "string" 
    ? jiraTask.description 
    : extractDescription(jiraTask.description);

  return {
    user_key: userId,
    title: jiraTask.summary || "Untitled",
    description: description || null,
    category: "work", // Default category for Jira tasks
    priority: mapJiraPriorityToPersonalTaskPriority(jiraTask.priority),
    jira_issue_key: jiraTask.key,
    jira_issue_url: jiraTask.url || (jiraBaseUrl ? `https://${jiraBaseUrl.replace(/^https?:\/\//, "")}/browse/${jiraTask.key}` : ""),
  };
}

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
    } catch {
      // JWT decode başarısız
    }
  }
  return undefined;
}

/**
 * Jira tasklarını kişisel tasklara sync et
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId: string | undefined = searchParams.get("userId") || undefined;

    if (!userId) userId = await getUserIdFromCookie();
    if (!userId) return NextResponse.json({ error: "Unauthorized: Please log in first" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { jiraBaseUrl: bodyJiraBaseUrl, maxResults = 100 } = body;

    const { jiraToken, apiUrl, cloudId, jiraBaseUrl } = await getJiraApiDetails(userId, bodyJiraBaseUrl);

    // Kullanıcıya assign edilmiş issue'ları çek
    const searchEndpoint = `${apiUrl}/rest/api/3/search/jql`;
    const searchResponse = await fetch(searchEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: "assignee = currentUser() ORDER BY updated DESC",
        maxResults,
        fields: ["summary", "description", "status", "priority", "assignee", "issuetype", "project", "created", "updated"],
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      let errorData: JiraApiErrorResponse | null = null;
      try {
        errorData = JSON.parse(errorText) as JiraApiErrorResponse;
      } catch { /* empty */ }
      const errorMessage = errorData?.errorMessages?.[0] || errorData?.error || errorData?.message || `Failed to fetch Jira issues: ${searchResponse.status} ${searchResponse.statusText}`;
      return NextResponse.json({ error: formatErrorMessage(errorMessage), details: errorText }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    const issues = searchData.issues || [];

    // JiraTask formatına çevir
    const jiraTasks: JiraTask[] = issues.map((issue: {
      id: string;
      key: string;
      fields: {
        summary: string;
        description?: unknown;
        status: { name: string; statusCategory: { colorName: string } };
        assignee?: { displayName: string; avatarUrls: { "48x48": string }; accountId: string };
        priority?: { name: string };
        issuetype: { name: string };
        project: { key: string; name: string };
        created: string;
        updated: string;
        resolutiondate?: string;
      };
    }) => {
      const issueUrl = jiraBaseUrl
        ? `https://${jiraBaseUrl.replace(/^https?:\/\//, "")}/browse/${issue.key}`
        : cloudId
        ? `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`
        : `${apiUrl}/browse/${issue.key}`;

      return {
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
        url: issueUrl,
      };
    });

    // Supabase'e kaydet
    let supabase;
    try {
      supabase = getSupabaseServer();
    } catch {
      supabase = getSupabase();
    }

    const syncedTasks: Array<{ key: string; action: "created" | "updated" }> = [];
    const errors: Array<{ key: string; error: string }> = [];

    for (const jiraTask of jiraTasks) {
      try {
        const personalTaskData = convertJiraTaskToPersonalTask(jiraTask, userId, jiraBaseUrl);

        // jira_issue_key ile mevcut task'ı kontrol et
        const { data: existingTask } = await supabase
          .from("user_personal_tasks")
          .select("id")
          .eq("user_key", userId)
          .eq("jira_issue_key", jiraTask.key)
          .maybeSingle();

        if (existingTask) {
          // Update
          const { error: updateError } = await supabase
            .from("user_personal_tasks")
            .update({
              title: personalTaskData.title,
              description: personalTaskData.description,
              priority: personalTaskData.priority,
              jira_issue_url: personalTaskData.jira_issue_url,
            })
            .eq("id", existingTask.id);

          if (updateError) {
            errors.push({ key: jiraTask.key, error: formatErrorMessage(updateError) });
          } else {
            syncedTasks.push({ key: jiraTask.key, action: "updated" });
          }
        } else {
          // Insert
          const { error: insertError } = await supabase
            .from("user_personal_tasks")
            .insert(personalTaskData);

          if (insertError) {
            errors.push({ key: jiraTask.key, error: formatErrorMessage(insertError) });
          } else {
            syncedTasks.push({ key: jiraTask.key, action: "created" });
          }
        }
      } catch (taskError) {
        errors.push({
          key: jiraTask.key,
          error: formatErrorMessage(taskError),
        });
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedTasks.length,
      created: syncedTasks.filter((t) => t.action === "created").length,
      updated: syncedTasks.filter((t) => t.action === "updated").length,
      errors: errors.length,
      details: {
        syncedTasks,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: formatErrorMessage(error) },
      { status: 500 }
    );
  }
}

