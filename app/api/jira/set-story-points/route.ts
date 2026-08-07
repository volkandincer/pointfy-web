import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { jiraConfig } from "@/lib/jiraConfig";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";

const isJiraApiErrorResponse = (
  value: unknown
): value is JiraApiErrorResponse => typeof value === "object" && value !== null;

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");

/**
 * Jira issue'a story point set et
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

    // Request body'den verileri al
    const body = await request.json();
    const { issueId, storyPoints, jiraBaseUrl: bodyJiraBaseUrl } = body;

    if (!issueId || storyPoints === undefined || storyPoints === null) {
      return NextResponse.json(
        { error: "issueId and storyPoints are required" },
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

    return await handleSetStoryPoints(
      userRow,
      issueId,
      storyPoints,
      bodyJiraBaseUrl || userRow.jira_base_url || fallbackJiraBaseUrl,
      userId
    );
  } catch (error) {
    // Jira set story points API error
    return NextResponse.json(
      { error: "Jira API hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

async function handleSetStoryPoints(
  userRow: {
    jira_access_token: string;
    jira_refresh_token: string | null;
    jira_token_expires_at: string | null;
    jira_base_url?: string | null;
  },
  issueId: string,
  storyPoints: number,
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

  // Token süresi kontrolü: sadece expires_at set edilmişse ve süresi dolmuşsa refresh yap
  // expires_at null ise token'ı direkt kullan (eski token'lar için backward compatibility)
  // Sadece token süresi gerçekten dolmuşsa refresh yap (buffer kaldırıldı - gereksiz refresh'i önlemek için)
  const shouldRefresh =
    tokenExpiresAt && tokenExpiresAt <= new Date(); // Sadece süresi dolmuşsa refresh yap

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
    } catch {
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
  } catch {
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

  // Story point field ID'sini bul (customfield_10016 genellikle story points için)
  // Önce issue'u çekerek field ID'sini bulalım
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

  // Story points field'ını bul (customfield_10016 veya benzeri)
  // Jira'da story points genellikle "Story Points" veya "Story point estimate" olarak adlandırılır
  let storyPointFieldId: string | null = null;

  // Önce bilinen field ID'lerini dene
  const knownStoryPointFields = [
    "customfield_10016", // Yaygın story points field ID'si
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
    // Field metadata'sını al
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

      // Story points field'ını bul
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
    // Story points field bulunamadı, default field kullanılıyor
  }

  // Story point'i set et
  const updateResponse = await fetch(
    `${apiUrl}/rest/api/3/issue/${issueId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${jiraToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          [storyPointFieldId]: storyPoints,
        },
      }),
    }
  );

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    let errorDetails = errorText;
    try {
      const parsed = JSON.parse(errorText);
      if (isJiraApiErrorResponse(parsed)) {
        errorDetails = parsed.errorMessage || parsed.message || errorText;
      }
    } catch {
      // JSON parse başarısız
    }

    // Story point set error

    return NextResponse.json(
      {
        error: `Story point set edilemedi: ${errorDetails}`,
        details: errorDetails,
        fieldId: storyPointFieldId,
      },
      { status: updateResponse.status }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Story point başarıyla set edildi",
    issueId,
    storyPoints,
    fieldId: storyPointFieldId,
  });
}

