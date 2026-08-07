import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";
import type { JiraApiErrorResponse } from "@/interfaces/Jira.interface";

/**
 * Jira kullanıcı bilgilerini getir (/rest/api/3/myself)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized: Please log in first" },
        { status: 401 }
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

    // CloudId al
    let cloudId: string | undefined;
    try {
      const accessibleResourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${userRow.jira_access_token}`,
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
          (r) => r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira")
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
      const jiraBaseUrl =
        userRow.jira_base_url || resolveEnvValue("JIRA_BASE_URL");
      if (!jiraBaseUrl) {
        return NextResponse.json(
          { error: "Jira base URL could not be determined" },
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

    // Myself endpoint'ine istek yap
    const response = await fetch(`${apiUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Bearer ${userRow.jira_access_token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // Jira myself API error
    return NextResponse.json(
      { error: "Jira API hatası oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}

