import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";

interface JiraTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

/**
 * Jira OAuth callback handler
 * Authorization code'u access token'a çevirir ve kullanıcının Jira bilgilerini kaydeder
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const { clientId, clientSecret, getAppUrl } = jiraConfig;
  const appUrl = getAppUrl(request);

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/app/jira?error=${encodeURIComponent("Jira OAuth hatası: " + error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/app/jira?error=${encodeURIComponent("Eksik OAuth parametreleri")}`
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/app/jira?error=${encodeURIComponent(
        "Jira OAuth yapılandırma hatası. Lütfen JIRA_CLIENT_ID_TEST / JIRA_CLIENT_ID_PROD (ve secret) değişkenlerini docs/env.md'deki yönergelere göre ekleyin."
      )}`
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("jira_oauth_state")?.value;
  const returnUrl = cookieStore.get("jira_oauth_return_url")?.value || "/app/jira";
  
  // State'ten user ID'yi decode et
  let userIdFromState: string | undefined;
  const stateParts = state.split(":");
  if (stateParts.length === 2) {
    try {
      userIdFromState = Buffer.from(stateParts[1], "base64").toString();
    } catch {
      // State decode hatası
    }
  }
  
  // State güvenlik kontrolü
  const randomStateFromUrl = stateParts[0];

  if (!storedState || storedState !== randomStateFromUrl) {
    return NextResponse.redirect(
      `${appUrl}/app/jira?error=${encodeURIComponent("Geçersiz state")}`
    );
  }

  try {
    // 1. Authorization code'u access token'a çevir
    const redirectUri = `${appUrl}/api/auth/jira/callback`;
    const tokenResponse = await fetch(
      "https://auth.atlassian.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      // Token exchange hatası
      throw new Error(
        `Token exchange başarısız: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as JiraTokenResponse;

    // 2. Kullanıcıyı bul
    let supabase;
    try {
      supabase = getSupabaseServer();
    } catch {
      // Service role key bulunamadı, anon key kullanılıyor
      supabase = getSupabase();
    }

    let currentUserId: string | undefined = userIdFromState;

    // Eğer state'ten alınamadıysa, cookie'den al
    if (!currentUserId) {
      const accessToken = cookieStore.get("sb-access-token")?.value;
      if (accessToken) {
        try {
          const tokenParts = accessToken.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
            currentUserId = payload.sub;
          }
        } catch {
          // JWT decode hatası
        }
      }
    }

    if (!currentUserId) {
      throw new Error("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.");
    }

    // 3. Jira base URL'ini al (accessible resources API'sinden)
    let jiraBaseUrl: string | null = null;
    try {
      const resourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            Accept: "application/json",
          },
        }
      );

      if (resourcesResponse.ok) {
        const resources: Array<{ id: string; name?: string; url: string }> =
          await resourcesResponse.json();
        
        const jiraResource = resources.find(
          (r) =>
            r.url.includes("atlassian.net") || 
            r.url.includes("atlassian.com") ||
            r.name?.toLowerCase().includes("jira")
        );

        if (jiraResource) {
          jiraBaseUrl = jiraResource.url;
          // URL'yi normalize et
          if (jiraBaseUrl.endsWith("/")) {
            jiraBaseUrl = jiraBaseUrl.slice(0, -1);
          }
        } else if (resources.length > 0) {
          // İlk resource'u kullan
          jiraBaseUrl = resources[0].url;
          if (jiraBaseUrl.endsWith("/")) {
            jiraBaseUrl = jiraBaseUrl.slice(0, -1);
          }
        }
      }
    } catch {
      // Jira base URL fetch hatası - devam et, sadece token'ı kaydet
    }

    // 4. Jira token'ını ve base URL'ini users tablosuna kaydet
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    const updatePayload: {
      jira_access_token: string;
      jira_refresh_token: string | null;
      jira_token_expires_at: string;
      jira_base_url?: string | null;
    } = {
      jira_access_token: tokenData.access_token,
      jira_refresh_token: tokenData.refresh_token || null,
      jira_token_expires_at: expiresAt.toISOString(),
    };

    // Base URL varsa ekle
    if (jiraBaseUrl) {
      updatePayload.jira_base_url = jiraBaseUrl;
    }

    const { error: updateError } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", currentUserId)
      .select("id");

    if (updateError) {
      // Jira token update hatası
      throw new Error(`Jira token kaydedilemedi: ${updateError.message}`);
    }

    // 5. Cookie'leri temizle ve yönlendir
    const decodedReturnUrl = decodeURIComponent(returnUrl);
    const finalUrl = decodedReturnUrl.startsWith("/") ? decodedReturnUrl : "/app/jira";
    const redirectUrl = `${appUrl}${finalUrl}?jira_connected=true`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("jira_oauth_state");
    response.cookies.delete("jira_oauth_return_url");

    return response;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Jira OAuth hatası";
    // Jira OAuth callback hatası
    return NextResponse.redirect(
      `${appUrl}/app/jira?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

