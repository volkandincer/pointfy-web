import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";
import type {
  JiraAccessibleResource,
  JiraAdfDocument,
  JiraAdfNode,
  JiraApiErrorResponse,
  JiraSearchResponse,
  JiraTask,
} from "@/interfaces/Jira.interface";
import { resolveEnvValue } from "@/lib/appEnvironment";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Jira JQL ile arama yap
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first" },
        { status: 401 }
      );
    }

    // Request body'den JQL ve maxResults al
    const body = await request.json();
    const { jql, maxResults = 50 } = body;

    if (!jql || typeof jql !== "string") {
      return NextResponse.json(
        { error: "JQL query is required" },
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
          {
            error:
              "Jira token expired and no refresh token available. Please reconnect Jira.",
          },
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
            jira_refresh_token:
              refreshed.refresh_token || userRow.jira_refresh_token,
            jira_token_expires_at: expiresAt.toISOString(),
          })
          .eq("id", userId);

        userRow.jira_access_token = refreshed.access_token;
        userRow.jira_refresh_token =
          refreshed.refresh_token || userRow.jira_refresh_token;
        userRow.jira_token_expires_at = expiresAt.toISOString();
      } catch (refreshError) {
        const errorMessage =
          refreshError instanceof Error
            ? refreshError.message
            : "Failed to refresh token";
        return NextResponse.json(
          {
            error:
              "Jira token expired and refresh failed. Please reconnect Jira.",
            details: errorMessage,
          },
          { status: 401 }
        );
      }
    }

    // CloudId al
    let cloudId: string | undefined;
    try {
      const accessibleResourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${jiraToken}`,
            Accept: "application/json",
          },
        }
      );

      if (accessibleResourcesResponse.ok) {
        const resources =
          (await accessibleResourcesResponse.json()) as JiraAccessibleResource[];

        const jiraResource = resources.find(
          (r) =>
            r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira")
        );

        if (jiraResource) {
          cloudId = jiraResource.id;
        } else if (resources.length > 0) {
          cloudId = resources[0].id;
        }
      }
    } catch {
      // CloudId alınamadı
    }

    // Jira base URL ve API URL oluştur
    const jiraBaseUrl =
      searchParams.get("jiraBaseUrl") ||
      userRow.jira_base_url ||
      fallbackJiraBaseUrl;

    let apiUrl: string;
    if (cloudId) {
      apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
    } else {
      if (!jiraBaseUrl) {
        return NextResponse.json(
          {
            error:
              "Jira base URL could not be determined. Please provide it manually.",
            suggestion:
              "Jira URL'inizi manuel olarak girin (örn: pointf.atlassian.net)",
          },
          { status: 400 }
        );
      }
      let jiraUrl = jiraBaseUrl;
      if (!jiraUrl.startsWith("http")) {
        jiraUrl = `https://${jiraUrl}`;
      }
      if (jiraUrl.endsWith("/")) {
        jiraUrl = jiraUrl.slice(0, -1);
      }
      apiUrl = jiraUrl;
    }

    // JQL search endpoint'ine istek yap
    // /rest/api/3/search/jql endpoint'i POST ile kullanılır ve body'de JQL gönderilir
    const searchEndpoint = `${apiUrl}/rest/api/3/search/jql`;
    const response = await fetch(searchEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jql: jql,
        maxResults: Math.min(maxResults, 100),
        fields: [
          "summary",
          "description",
          "status",
          "assignee",
          "priority",
          "issuetype",
          "project",
          "created",
          "updated",
          "resolutiondate",
        ],
      }),
    });

    if (!response.ok) {
      // Token refresh mekanizması - 401 hatası alırsak token'ı refresh etmeyi dene
      if (response.status === 401 && userRow.jira_refresh_token) {
        try {
          const { refreshJiraToken } = await import("@/lib/jira");

          if (jiraClientId && jiraClientSecret) {
            const refreshed = await refreshJiraToken(
              userRow.jira_refresh_token,
              jiraClientId,
              jiraClientSecret
            );

            const expiresAt = new Date();
            expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);

            await supabase
              .from("users")
              .update({
                jira_access_token: refreshed.access_token,
                jira_refresh_token:
                  refreshed.refresh_token || userRow.jira_refresh_token,
                jira_token_expires_at: expiresAt.toISOString(),
              })
              .eq("id", userId);

            jiraToken = refreshed.access_token;

            // Yeni token ile tekrar dene
            const retryResponse = await fetch(`${apiUrl}/rest/api/3/search/jql`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${jiraToken}`,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                jql: jql,
                maxResults: Math.min(maxResults, 100),
                fields: [
                  "summary",
                  "description",
                  "status",
                  "assignee",
                  "priority",
                  "issuetype",
                  "project",
                  "created",
                  "updated",
                  "resolutiondate",
                ],
              }),
            });

            if (retryResponse.ok) {
              const retryData = (await retryResponse.json()) as JiraSearchResponse;
              if (!retryData.issues || !Array.isArray(retryData.issues)) {
                return NextResponse.json(
                  { error: "Invalid response format from Jira API" },
                  { status: 500 }
                );
              }

              // Response mapping (retry için)
              const jiraBaseUrlForUrl =
                userRow.jira_base_url || resolveEnvValue("JIRA_BASE_URL");
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

              const extractDescription = (
                desc: JiraAdfDocument | string | undefined
              ): string | undefined => {
                if (!desc) return undefined;
                if (typeof desc === "string") return desc;

                const extractText = (node: JiraAdfNode): string => {
                  const currentText = node.text ?? "";
                  if (node.content && Array.isArray(node.content)) {
                    return currentText + node.content.map(extractText).join("");
                  }
                  return currentText;
                };

                if (Array.isArray(desc.content)) {
                  const combined = desc.content.map(extractText).join("").trim();
                  return combined || undefined;
                }

                return undefined;
              };

              const tasks: JiraTask[] = retryData.issues
                .filter((issue) => issue.fields !== undefined)
                .map((issue) => {
                  if (!issue.fields) {
                    throw new Error("Issue missing fields after filter");
                  }
                  return {
                    id: issue.id,
                    key: issue.key,
                    summary: issue.fields.summary,
                    description: extractDescription(issue.fields.description),
                    status: issue.fields.status.name,
                    statusColor: issue.fields.status.statusCategory.colorName,
                    assignee: issue.fields.assignee
                      ? {
                          name: issue.fields.assignee.displayName,
                          avatar: issue.fields.assignee.avatarUrls["48x48"],
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
                });

              return NextResponse.json({
                issues: tasks,
                total: retryData.total,
                startAt: retryData.startAt,
                maxResults: retryData.maxResults,
              });
            }
          }
        } catch {
          // Token refresh başarısız
        }
      }

      // Error handling (token refresh başarısız olduysa veya 401 değilse)
      const errorText = await response.text();
      let errorJson: JiraApiErrorResponse | null = null;
      try {
        const parsed = JSON.parse(errorText);
        if (typeof parsed === "object" && parsed !== null) {
          errorJson = parsed as JiraApiErrorResponse;
        }
      } catch {
        // JSON parse başarısız
      }

      const errorMessage = errorJson?.errorMessages?.[0] || errorJson?.error || errorJson?.message || "Jira API hatası oluştu. Lütfen tekrar deneyin.";
      return NextResponse.json(
        { error: formatErrorMessage(errorMessage) },
        { status: response.status }
      );
    }

    const data = (await response.json()) as JiraSearchResponse;

    if (!data.issues || !Array.isArray(data.issues)) {
      return NextResponse.json(
        { error: "Invalid response format from Jira API" },
        { status: 500 }
      );
    }

    // Helper function: ADF format description'ı string'e çevir
    const extractDescription = (
      desc: JiraAdfDocument | string | undefined
    ): string | undefined => {
      if (!desc) return undefined;
      if (typeof desc === "string") return desc;

      const extractText = (node: JiraAdfNode): string => {
        const currentText = node.text ?? "";
        if (node.content && Array.isArray(node.content)) {
          return currentText + node.content.map(extractText).join("");
        }
        return currentText;
      };

      if (Array.isArray(desc.content)) {
        const combined = desc.content.map(extractText).join("").trim();
        return combined || undefined;
      }

      return undefined;
    };

    // JiraIssue[] formatını JiraTask[] formatına dönüştür
    const jiraBaseUrlForUrl =
      userRow.jira_base_url || resolveEnvValue("JIRA_BASE_URL");
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

    const tasks: JiraTask[] = data.issues
      .filter((issue) => issue.fields !== undefined)
      .map((issue) => {
        if (!issue.fields) {
          throw new Error("Issue missing fields after filter");
        }
        return {
          id: issue.id,
          key: issue.key,
          summary: issue.fields.summary,
          description: extractDescription(issue.fields.description),
          status: issue.fields.status.name,
          statusColor: issue.fields.status.statusCategory.colorName,
          assignee: issue.fields.assignee
            ? {
                name: issue.fields.assignee.displayName,
                avatar: issue.fields.assignee.avatarUrls["48x48"],
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
      });

    return NextResponse.json({
      issues: tasks,
      total: data.total,
      startAt: data.startAt,
      maxResults: data.maxResults,
    });
  } catch (error) {
    // Jira search API error
    return NextResponse.json(
      { error: "Jira API hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

