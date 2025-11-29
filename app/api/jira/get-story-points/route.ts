import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { jiraConfig } from "@/lib/jiraConfig";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";

const isJiraApiErrorResponse = (
  value: unknown
): value is JiraApiErrorResponse => typeof value === "object" && value !== null;

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Jira issue'dan story point değerini getir
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
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

    const issueId = searchParams.get("issueId");
    const jiraBaseUrl = searchParams.get("jiraBaseUrl");

    if (!issueId) {
      return NextResponse.json(
        { error: "issueId is required" },
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

    return await handleGetStoryPoints(
      userRow,
      issueId,
      jiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl,
      userId
    );
  } catch (error) {
    // Jira get story points API error
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleGetStoryPoints(
  userRow: {
    jira_access_token: string;
    jira_refresh_token: string | null;
    jira_token_expires_at: string | null;
    jira_base_url?: string | null;
  },
  issueId: string,
  jiraBaseUrl: string | null | undefined,
  userId?: string
) {
  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch {
    supabase = getSupabase();
  }

  // Token refresh kontrolü
  let jiraToken = userRow.jira_access_token;
  const tokenExpiresAt = userRow.jira_token_expires_at
    ? new Date(userRow.jira_token_expires_at)
    : null;

  if (tokenExpiresAt && tokenExpiresAt < new Date()) {
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
      // Jira token refresh error
      return NextResponse.json(
        { error: "Jira token expired and refresh failed. Please reconnect Jira." },
        { status: 401 }
      );
    }
  }

  if (!jiraBaseUrl) {
    return NextResponse.json(
      { error: "Jira base URL could not be determined" },
      { status: 400 }
    );
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
      const resources = (await accessibleResourcesResponse.json()) as Array<{
        id: string;
        name: string;
        url: string;
      }>;

      const jiraResource = resources.find(
        (r) =>
          r.url.includes("atlassian.net") ||
          r.name.toLowerCase().includes("jira")
      );

      if (jiraResource) {
        cloudId = jiraResource.id;
      } else if (resources.length > 0) {
        cloudId = resources[0].id;
      }
    }
  } catch (error) {
    // CloudId alınamadı
  }

  // API URL oluştur
  let apiUrl: string;
  if (cloudId) {
    apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
  } else {
    let jiraUrl = jiraBaseUrl;
    if (!jiraUrl.startsWith("http")) {
      jiraUrl = `https://${jiraUrl}`;
    }
    if (jiraUrl.endsWith("/")) {
      jiraUrl = jiraUrl.slice(0, -1);
    }
    apiUrl = jiraUrl;
  }

  // Issue'u çek
  const issueResponse = await fetch(
    `${apiUrl}/rest/api/3/issue/${issueId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
      },
    }
  );

  if (!issueResponse.ok) {
    const errorText = await issueResponse.text();
    return NextResponse.json(
      { error: `Issue bulunamadı: ${errorText}` },
      { status: issueResponse.status }
    );
  }

  const issueData = (await issueResponse.json()) as {
    fields: Record<string, unknown>;
  };

  // Story points field'ını bul
  let storyPointFieldId: string | null = null;
  const knownStoryPointFields = [
    "customfield_10016",
    "customfield_10020",
    "customfield_10021",
  ];

  for (const fieldId of knownStoryPointFields) {
    if (issueData.fields[fieldId] !== undefined) {
      storyPointFieldId = fieldId;
      break;
    }
  }

  // Eğer bilinen field ID'lerinden biri yoksa, tüm field'ları kontrol et
  if (!storyPointFieldId) {
    const fieldsResponse = await fetch(
      `${apiUrl}/rest/api/3/field`,
      {
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          Accept: "application/json",
        },
      }
    );

    if (fieldsResponse.ok) {
      const fields = (await fieldsResponse.json()) as Array<{
        id: string;
        name: string;
        schema?: { type: string; custom?: string };
      }>;

      const storyPointField = fields.find(
        (f) =>
          (f.name.toLowerCase().includes("story point") ||
            f.name.toLowerCase().includes("story point estimate")) &&
          (f.schema?.type === "number" || f.schema?.custom === "com.atlassian.jira.plugin.system.customfieldtypes:float")
      );

      if (storyPointField) {
        storyPointFieldId = storyPointField.id;
      }
    }
  }

  if (!storyPointFieldId) {
    // Story points field bulunamadı, default olarak customfield_10016 kullan
    storyPointFieldId = "customfield_10016";
  }

  // Story point değerini al
  const storyPoints = issueData.fields[storyPointFieldId];
  const storyPointsValue = typeof storyPoints === "number" ? storyPoints : null;

  return NextResponse.json({
    success: true,
    storyPoints: storyPointsValue,
    fieldId: storyPointFieldId,
    issueId,
  });
}

