import { NextResponse } from "next/server";
import { jiraConfig } from "@/lib/jiraConfig";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";

/**
 * Jira OAuth başlatma endpoint'i
 * Kullanıcıyı Jira OAuth sayfasına yönlendirir
 */
export async function GET(request: Request) {
  const { clientId, getAppUrl } = jiraConfig;
  const appUrl = getAppUrl(request);
  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get("returnUrl") || "/app/jira";

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

  // Kullanıcıyı doğrula (Supabase session token'ından, query'den gelen ham
  // userId'den değil) — aksi halde herhangi biri başka bir kullanıcının
  // userId'sini vererek kendi Jira hesabını o kullanıcıya bağlayabilirdi.
  const currentUserId = await getUserIdFromRequest(request);

  if (!currentUserId) {
    return NextResponse.json(
      { error: "Unauthorized: Please log in first" },
      { status: 401 }
    );
  }

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
  // read:jira-user: Kullanıcı bilgilerine erişim (assignable users için gerekli)
  authUrl.searchParams.set(
    "scope",
    "read:jira-work write:jira-work offline_access read:board-scope:jira-software read:jira-user"
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
