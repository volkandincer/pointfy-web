import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jiraConfig } from "@/lib/jiraConfig";

/**
 * Jira OAuth başlatma endpoint'i
 * Kullanıcıyı Jira OAuth sayfasına yönlendirir
 */
export async function GET(request: Request) {
  const { clientId, appUrl } = jiraConfig;
  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get("returnUrl") || "/app/jira-test";
  const userIdFromQuery = searchParams.get("userId");

  if (!clientId) {
    return NextResponse.json(
      {
        error: "Jira OAuth yapılandırılmamış",
        details:
          "JIRA_CLIENT_ID_* environment variable'ları eksik. Lütfen .env dosyanıza JIRA_CLIENT_ID_TEST / JIRA_CLIENT_ID_PROD ve karşılık gelen secret değerlerini ekleyin (bkz. docs/env.md). Jira OAuth uygulaması oluşturmak için: https://developer.atlassian.com/console/myapps/",
      },
      { status: 500 }
    );
  }

  // Önce query parametresinden user ID'yi al
  let currentUserId: string | undefined = userIdFromQuery || undefined;

  // Eğer query'den alınamadıysa, cookie'den al
  if (!currentUserId) {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      try {
        const tokenParts = accessToken.split(".");
        if (tokenParts.length === 3) {
          const payload = JSON.parse(
            Buffer.from(tokenParts[1], "base64").toString()
          );
          currentUserId = payload.sub;
        }
      } catch (error) {
        console.warn("JWT decode başarısız:", error);
      }
    }
  }

  console.log("🔍 Jira OAuth başlatma - User ID:", {
    fromQuery: !!userIdFromQuery,
    fromCookie: !userIdFromQuery && !!currentUserId,
    userId: currentUserId?.substring(0, 20) + "...",
  });

  // OAuth state oluştur - user ID'yi state'e encode et
  const randomState = Math.random().toString(36).substring(2, 15);
  const statePayload = currentUserId
    ? `${randomState}:${Buffer.from(currentUserId).toString("base64")}`
    : randomState;

  const redirectUri = `${appUrl}/api/auth/jira/callback`;

  // Jira OAuth 2.0 (3LO) authorization URL
  // Jira Cloud için: https://auth.atlassian.com/authorize
  const authUrl = new URL("https://auth.atlassian.com/authorize");
  authUrl.searchParams.set("audience", "api.atlassian.com");
  authUrl.searchParams.set("client_id", clientId);
  // Jira OAuth scope'ları
  // read:jira-work: Temel Jira verilerine erişim (issues, projects, vb.)
  // write:jira-work: Jira verilerini güncelleme
  // offline_access: Refresh token almak için
  // read:board-scope:jira-software: Agile API (board'lar ve sprint'ler) için erişim
  authUrl.searchParams.set(
    "scope",
    "read:jira-work write:jira-work offline_access read:board-scope:jira-software"
  );
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", statePayload);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("prompt", "consent");

  const response = NextResponse.redirect(authUrl.toString());
  // State'in ilk kısmını (randomState) cookie'de sakla (güvenlik kontrolü için)
  response.cookies.set("jira_oauth_state", randomState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 dakika
  });
  response.cookies.set("jira_oauth_return_url", returnUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 dakika
  });

  return response;
}
