import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import type { JiraApiErrorResponse, JiraComment, JiraAdfDocument, JiraAdfNode } from "@/interfaces/Jira.interface";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Jira issue comment'lerini getir
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ issueKey: string }> | { issueKey: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const resolvedParams = await Promise.resolve(params);
    const issueKey = resolvedParams?.issueKey;
    const userId = await getUserIdFromRequest(request);

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
      } catch (refreshError: unknown) {
        const errorMessage = refreshError instanceof Error ? refreshError.message : JSON.stringify(refreshError);
        return NextResponse.json(
          {
            error: "Jira token expired and refresh failed. Please reconnect Jira.",
            details: errorMessage,
          },
          { status: 401 }
        );
      }
    }

    // Jira base URL ve cloud ID'yi al
    const queryJiraBaseUrl = searchParams.get("jiraBaseUrl");
    const jiraBaseUrl = queryJiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl;
    let apiUrl = "";
    let cloudId: string | null = null;

    if (jiraBaseUrl && !jiraBaseUrl.includes("atlassian.net") && !jiraBaseUrl.includes("atlassian.com")) {
      // Self-hosted Jira
      let url = jiraBaseUrl;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      apiUrl = url;
    } else {
      // Cloud Jira
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
          const resources: Array<{ id: string; url: string; name: string }> =
            await resourcesResponse.json();

          const jiraResource = resources.find(
            (r) => r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira")
          );

          if (jiraResource) {
            cloudId = jiraResource.id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          } else if (resources.length > 0) {
            cloudId = resources[0].id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          }
        }
      } catch {
        // Cloud ID fetch error
      }
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Jira base URL not configured" },
        { status: 400 }
      );
    }

    // Comment'leri getir
    const commentsEndpoint = `${apiUrl}/rest/api/3/issue/${issueKey}/comment`;
    const response = await fetch(commentsEndpoint, {
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
        `Failed to fetch comments: ${response.status} ${response.statusText}`;

      return NextResponse.json(
        { error: formatErrorMessage(errorMessage) },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Comment body'lerini extract et (ADF formatından)
    const extractText = (node: JiraAdfNode): string => {
      if (node.text) return node.text;
      if (node.content) {
        return node.content.map(extractText).join("");
      }
      return "";
    };

    const extractCommentBody = (body: JiraAdfDocument | string | undefined): string => {
      if (!body) return "";
      if (typeof body === "string") return body;

      if (body.content) {
        return body.content.map(extractText).join("\n");
      }
      return "";
    };

    const comments: JiraComment[] = (data.comments || []).map((comment: {
      id: string;
      body: JiraAdfDocument | string;
      author: {
        accountId: string;
        displayName: string;
        avatarUrls: {
          "48x48": string;
        };
      };
      created: string;
      updated?: string;
    }) => ({
      id: comment.id,
      body: extractCommentBody(comment.body),
      author: comment.author,
      created: comment.created,
      updated: comment.updated,
    }));

    return NextResponse.json({ comments });
  } catch (error) {
    return NextResponse.json(
      { error: "Jira API hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

/**
 * Jira issue'a comment ekle
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ issueKey: string }> | { issueKey: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const issueKey = resolvedParams?.issueKey;
    const { searchParams } = new URL(request.url);
    const userId = await getUserIdFromRequest(request);
    const { body } = await request.json();

    if (!body || typeof body !== "string" || body.trim() === "") {
      return NextResponse.json(
        { error: "Comment body is required" },
        { status: 400 }
      );
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
      } catch (refreshError: unknown) {
        const errorMessage = refreshError instanceof Error ? refreshError.message : JSON.stringify(refreshError);
        return NextResponse.json(
          {
            error: "Jira token expired and refresh failed. Please reconnect Jira.",
            details: errorMessage,
          },
          { status: 401 }
        );
      }
    }

    // Jira base URL ve cloud ID'yi al
    const queryJiraBaseUrl = searchParams.get("jiraBaseUrl");
    const jiraBaseUrl = queryJiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl;
    let apiUrl = "";
    let cloudId: string | null = null;

    if (jiraBaseUrl && !jiraBaseUrl.includes("atlassian.net") && !jiraBaseUrl.includes("atlassian.com")) {
      // Self-hosted Jira
      let url = jiraBaseUrl;
      if (!url.startsWith("http")) {
        url = `https://${url}`;
      }
      if (url.endsWith("/")) {
        url = url.slice(0, -1);
      }
      apiUrl = url;
    } else {
      // Cloud Jira
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
          const resources: Array<{ id: string; url: string; name: string }> =
            await resourcesResponse.json();

          const jiraResource = resources.find(
            (r) => r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira")
          );

          if (jiraResource) {
            cloudId = jiraResource.id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          } else if (resources.length > 0) {
            cloudId = resources[0].id;
            apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
          }
        }
      } catch {
        // Cloud ID fetch error
      }
    }

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Jira base URL not configured" },
        { status: 400 }
      );
    }

    // Comment ekle (ADF formatında)
    const commentBody = {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: body.trim(),
            },
          ],
        },
      ],
    };

    const commentsEndpoint = `${apiUrl}/rest/api/3/issue/${issueKey}/comment`;
    const response = await fetch(commentsEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        body: commentBody,
      }),
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
        `Failed to add comment: ${response.status} ${response.statusText}`;

      return NextResponse.json(
        { error: formatErrorMessage(errorMessage) },
        { status: response.status }
      );
    }

    const newComment = await response.json();

    // Comment body'yi extract et
    const extractText = (node: JiraAdfNode): string => {
      if (node.text) return node.text;
      if (node.content) {
        return node.content.map(extractText).join("");
      }
      return "";
    };

    const extractCommentBody = (body: JiraAdfDocument | string | undefined): string => {
      if (!body) return "";
      if (typeof body === "string") return body;

      if (body.content) {
        return body.content.map(extractText).join("\n");
      }
      return "";
    };

    const comment: JiraComment = {
      id: newComment.id,
      body: extractCommentBody(newComment.body as JiraAdfDocument | string),
      author: newComment.author,
      created: newComment.created,
      updated: newComment.updated,
    };

    return NextResponse.json({ comment });
  } catch (error) {
    return NextResponse.json(
      { error: "Jira API hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

