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
  const timestamp = new Date().toISOString();
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const { clientId, clientSecret, appUrl } = jiraConfig;

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/app/jira-test?error=${encodeURIComponent("Jira OAuth hatası: " + error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/app/jira-test?error=${encodeURIComponent("Eksik OAuth parametreleri")}`
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/app/jira-test?error=${encodeURIComponent(
        "Jira OAuth yapılandırma hatası. Lütfen JIRA_CLIENT_ID_TEST / JIRA_CLIENT_ID_PROD (ve secret) değişkenlerini docs/env.md'deki yönergelere göre ekleyin."
      )}`
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("jira_oauth_state")?.value;
  const returnUrl = cookieStore.get("jira_oauth_return_url")?.value || "/app/jira-test";
  
  // State'ten user ID'yi decode et
  let userIdFromState: string | undefined;
  const stateParts = state.split(":");
  if (stateParts.length === 2) {
    try {
      userIdFromState = Buffer.from(stateParts[1], "base64").toString();
    } catch (decodeError) {
      // State decode hatası
    }
  }
  
  // State güvenlik kontrolü
  const randomStateFromUrl = stateParts[0];

  if (!storedState || storedState !== randomStateFromUrl) {
    return NextResponse.redirect(
      `${appUrl}/app/jira-test?error=${encodeURIComponent("Geçersiz state")}`
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
      const errorText = await tokenResponse.text();
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
    } catch (serviceError) {
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
        } catch (tokenError) {
          // JWT decode hatası
        }
      }
    }

    if (!currentUserId) {
      throw new Error("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.");
    }


    // 3. Jira token'ını users tablosuna kaydet
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        jira_access_token: tokenData.access_token,
        jira_refresh_token: tokenData.refresh_token || null,
        jira_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", currentUserId)
      .select("id");
    
      hasData: !!updateData,
      dataLength: updateData?.length,
      error: updateError,
      errorCode: updateError?.code,
      errorMessage: updateError?.message,
    });

    if (updateError) {
      // Jira token update hatası
      throw new Error(`Jira token kaydedilemedi: ${updateError.message}`);
    }

      userId: currentUserId.substring(0, 20) + "...",
      expiresAt: expiresAt.toISOString(),
    });

    // 4. Cookie'leri temizle ve yönlendir
    const decodedReturnUrl = decodeURIComponent(returnUrl);
    const finalUrl = decodedReturnUrl.startsWith("/") ? decodedReturnUrl : "/app/jira-test";
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
      `${appUrl}/app/jira-test?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

