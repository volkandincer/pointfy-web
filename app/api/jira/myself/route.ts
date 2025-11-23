import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";

/**
 * Jira kullanıcı bilgilerini getir (/rest/api/3/myself)
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
          } catch (tokenError) {
            // JWT decode başarısız
          }
        }
      } catch (authError) {
        console.error("Auth error:", authError);
      }
    }

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
    } catch (error) {
      console.warn("CloudId alınamadı:", error);
    }

    // API URL oluştur
    let apiUrl: string;
    if (cloudId) {
      apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
    } else {
      const jiraBaseUrl = userRow.jira_base_url || process.env.JIRA_BASE_URL;
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
      let errorJson: any = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch {
        // JSON parse başarısız
      }

      return NextResponse.json(
        errorJson || { error: errorText || `Jira API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Jira myself API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

