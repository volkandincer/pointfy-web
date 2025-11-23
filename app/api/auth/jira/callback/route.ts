import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";

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
  console.log(`[${timestamp}] 🔵 Jira OAuth callback başladı`);
  console.log(`[${timestamp}] 🔵 Request URL:`, request.url);
  
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const clientId = process.env.JIRA_CLIENT_ID;
  const clientSecret = process.env.JIRA_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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
      `${appUrl}/app/jira-test?error=${encodeURIComponent("Jira OAuth yapılandırma hatası. JIRA_CLIENT_ID ve JIRA_CLIENT_SECRET environment variable'ları eksik. Lütfen .env.local dosyanıza bu değişkenleri ekleyin.")}`
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
      console.log(`[${timestamp}] ✅ State'ten user ID decode edildi:`, { userId: userIdFromState?.substring(0, 20) + "..." });
    } catch (decodeError) {
      console.warn("⚠️ State decode hatası:", decodeError);
    }
  }
  
  // State güvenlik kontrolü
  const randomStateFromUrl = stateParts[0];
  console.log(`[${timestamp}] 🍪 Cookie kontrolü:`, {
    hasState: !!storedState,
    stateMatch: storedState === randomStateFromUrl,
    returnUrl,
    hasUserIdInState: !!userIdFromState,
  });

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
      console.error(`[${timestamp}] ❌ Token exchange hatası:`, {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Token exchange başarısız: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as JiraTokenResponse;
    console.log(`[${timestamp}] ✅ Token exchange başarılı:`, {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
    });

    // 2. Kullanıcıyı bul
    let supabase;
    try {
      supabase = getSupabaseServer();
      console.log(`[${timestamp}] ✅ Service role key ile Supabase client oluşturuldu`);
    } catch (serviceError) {
      console.warn("⚠️ Service role key bulunamadı, anon key kullanılıyor:", serviceError);
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
          console.warn("⚠️ JWT decode hatası:", tokenError);
        }
      }
    }

    if (!currentUserId) {
      throw new Error("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın.");
    }

    console.log(`[${timestamp}] ✅ Kullanıcı bulundu, Jira token'ı kaydediliyor...`, { userId: currentUserId.substring(0, 20) + "..." });

    // 3. Jira token'ını users tablosuna kaydet
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    console.log(`[${timestamp}] 🔄 Update başlıyor - User ID:`, currentUserId.substring(0, 20) + "...");
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        jira_access_token: tokenData.access_token,
        jira_refresh_token: tokenData.refresh_token || null,
        jira_token_expires_at: expiresAt.toISOString(),
      })
      .eq("id", currentUserId)
      .select("id");
    
    console.log(`[${timestamp}] 🔄 Update sonucu:`, {
      hasData: !!updateData,
      dataLength: updateData?.length,
      error: updateError,
      errorCode: updateError?.code,
      errorMessage: updateError?.message,
    });

    if (updateError) {
      console.error(`[${timestamp}] ❌ Jira token update hatası:`, updateError);
      throw new Error(`Jira token kaydedilemedi: ${updateError.message}`);
    }

    console.log(`[${timestamp}] ✅ Jira token başarıyla kaydedildi:`, {
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
    console.error(`[${timestamp}] ❌ Jira OAuth callback hatası:`, err);
    return NextResponse.redirect(
      `${appUrl}/app/jira-test?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

