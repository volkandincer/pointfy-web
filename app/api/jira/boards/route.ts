import { NextResponse } from "next/server";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import { resolveEnvValue } from "@/lib/appEnvironment";
import { formatErrorMessage } from "@/lib/utils/errorHandler";
import { getUserIdFromRequest } from "@/src/infrastructure/utils/getUserIdFromRequest";
import type {
  JiraAccessibleResource,
  JiraApiErrorResponse,
  JiraProjectSummary,
} from "@/interfaces/Jira.interface";

const isJiraApiErrorResponse = (
  value: unknown
): value is JiraApiErrorResponse => typeof value === "object" && value !== null;

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
const fallbackJiraBaseUrl = resolveEnvValue("JIRA_BASE_URL");
/**
 * Jira Board'larını getir
 * Jira OAuth token'ı kullanarak Jira API'ye erişir
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

    let supabase;
    try {
      supabase = getSupabaseServer();
    } catch {
      supabase = getSupabase();
    }

    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select(
        "jira_access_token, jira_refresh_token, jira_token_expires_at, jira_base_url"
      )
      .eq("id", userId)
      .maybeSingle();

    if (userError || !userRow) {
      // User fetch error
      return NextResponse.json(
        { error: `User not found: ${userError?.message || "Unknown error"}` },
        { status: 404 }
      );
    }

    if (!userRow.jira_access_token) {
      return NextResponse.json(
        {
          error: "Jira bağlantısı gerekli. Lütfen Jira hesabınızı bağlayın.",
          suggestion:
            "Jira sayfasından 'Connect Jira' butonuna tıklayarak Jira hesabınızı bağlayın.",
        },
        { status: 400 }
      );
    }

    return await handleJiraRequestWithJiraToken(userRow, request, userId);
  } catch {
    // Jira boards API error
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * Jira token ile Jira API'ye istek yap
 */
async function handleJiraRequestWithJiraToken(
  userRow: {
    jira_access_token: string;
    jira_refresh_token: string | null;
    jira_token_expires_at: string | null;
    jira_base_url?: string | null;
  },
  request: Request,
  userId?: string
) {
  let supabase;
  try {
    supabase = getSupabaseServer();
  } catch {
    supabase = getSupabase();
  }

  let jiraToken = userRow.jira_access_token;
  const tokenExpiresAt = userRow.jira_token_expires_at
    ? new Date(userRow.jira_token_expires_at)
    : null;

  // Token süresi kontrolü: sadece expires_at set edilmişse ve süresi dolmuşsa refresh yap
  // expires_at null ise token'ı direkt kullan (eski token'lar için backward compatibility)
  // Sadece token süresi gerçekten dolmuşsa refresh yap (buffer kaldırıldı - gereksiz refresh'i önlemek için)
  const shouldRefresh = tokenExpiresAt && tokenExpiresAt <= new Date(); // Sadece süresi dolmuşsa refresh yap

  if (shouldRefresh) {
    if (!userRow.jira_refresh_token) {
      return NextResponse.json(
        {
          error:
            "Jira token expired and no refresh token available. Please reconnect Jira.",
        },
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
          jira_refresh_token:
            refreshed.refresh_token || userRow.jira_refresh_token,
          jira_token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", userId);

      // userRow'u güncelle ki accessible-resources'ta tekrar refresh yapmasın
      userRow.jira_access_token = refreshed.access_token;
      userRow.jira_refresh_token =
        refreshed.refresh_token || userRow.jira_refresh_token;
      userRow.jira_token_expires_at = expiresAt.toISOString();
    } catch (refreshError) {
      // Jira token refresh error
      const errorMessage =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh token";
      
      // Refresh token geçersizse, kullanıcının token'larını temizle (opsiyonel)
      // Bu sayede kullanıcı tekrar bağlanmak zorunda kalır
      if (errorMessage.includes("refresh_token is invalid") || errorMessage.includes("Refresh token geçersiz")) {
        try {
          await supabase
            .from("users")
            .update({
              jira_access_token: null,
              jira_refresh_token: null,
              jira_token_expires_at: null,
            })
            .eq("id", userId);
        } catch {
          // Token cleanup error - ignore
        }
      }
      
      return NextResponse.json(
        {
          error:
            "Jira token expired and refresh failed. Please reconnect Jira.",
          details: errorMessage,
          suggestion: "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın.",
        },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const jiraBaseUrl =
    searchParams.get("jiraBaseUrl") ||
    userRow.jira_base_url ||
    fallbackJiraBaseUrl;

  if (!jiraBaseUrl) {
    return NextResponse.json(
      {
        error:
          "Jira base URL could not be determined. Please provide it manually.",
        suggestion:
          "Jira URL'inizi manuel olarak girin (örn: pointf.atlassian.net)",
      },
      { status: 400 }
    );
  }

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

    if (!accessibleResourcesResponse.ok) {
      // Accessible resources hatası

      if (accessibleResourcesResponse.status === 401) {
        if (userRow.jira_refresh_token) {
          try {
            const { refreshJiraToken } = await import("@/lib/jira");
            if (jiraClientId && jiraClientSecret) {
              const refreshed = await refreshJiraToken(
                userRow.jira_refresh_token,
                jiraClientId,
                jiraClientSecret
              );

              // Yeni token ile tekrar dene
              const retryResponse = await fetch(
                "https://api.atlassian.com/oauth/token/accessible-resources",
                {
                  headers: {
                    Authorization: `Bearer ${refreshed.access_token}`,
                    Accept: "application/json",
                  },
                }
              );

              if (retryResponse.ok) {
                // Token refresh başarılı, yeni token'ı kaydet
                const expiresAt = new Date();
                expiresAt.setSeconds(
                  expiresAt.getSeconds() + refreshed.expires_in
                );

                await supabase
                  .from("users")
                  .update({
                    jira_access_token: refreshed.access_token,
                    jira_refresh_token:
                      refreshed.refresh_token || userRow.jira_refresh_token,
                    jira_token_expires_at: expiresAt.toISOString(),
                  })
                  .eq("id", userId);

                jiraToken = refreshed.access_token;

                // userRow'u güncelle ki sonraki isteklerde tekrar refresh yapmasın
                userRow.jira_access_token = refreshed.access_token;
                userRow.jira_refresh_token =
                  refreshed.refresh_token || userRow.jira_refresh_token;
                userRow.jira_token_expires_at = expiresAt.toISOString();

                // Tekrar accessible resources al
                const resources = (await retryResponse.json()) as Array<{
                  id: string;
                  name: string;
                  url: string;
                  scopes: string[];
                  avatarUrl?: string;
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
              } else {
                const retryErrorText = await retryResponse.text();
                // Token refresh sonrası hala 401
                throw new Error(
                  `Token refresh sonrası hala 401 hatası: ${retryErrorText}`
                );
              }
            } else {
              throw new Error("Jira OAuth configuration missing");
            }
          } catch (refreshError) {
            // Token refresh başarısız
            return NextResponse.json(
              {
                error:
                  "Jira API erişim hatası: Token geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.",
                details:
                  refreshError instanceof Error
                    ? refreshError.message
                    : "Token refresh denemesi başarısız oldu. Lütfen Jira'yı yeniden bağlayın.",
                suggestion:
                  "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın.",
              },
              { status: 401 }
            );
          }
        } else {
          return NextResponse.json(
            {
              error:
                "Jira API erişim hatası: Token geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.",
              details:
                "Accessible resources endpoint'i 401 döndü ve refresh token mevcut değil.",
              suggestion:
                "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın.",
            },
            { status: 401 }
          );
        }
      }
    } else {
      const resources =
        (await accessibleResourcesResponse.json()) as JiraAccessibleResource[];

      // Jira resource'unu bul (name veya url'den)
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
    // Hata durumunda fallback URL kullanılacak
  }

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

  // REST API v3 kullan (Agile API scope'ları mevcut değil)
  const response = await fetch(`${apiUrl}/rest/api/3/project`, {
    headers: {
      Authorization: `Bearer ${jiraToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    let errorJson: JiraApiErrorResponse | null = null;
    try {
      const parsed = JSON.parse(errorText);
      if (isJiraApiErrorResponse(parsed)) {
        errorJson = parsed;
        if (parsed.errorMessages && Array.isArray(parsed.errorMessages)) {
          errorDetails = JSON.stringify({
            errorMessages: parsed.errorMessages,
            errors: parsed.errors || {},
          });
        } else {
          errorDetails = parsed.errorMessage || parsed.message || errorText;
        }
      }
    } catch {
      // JSON parse başarısız, text olarak kullan
    }

    // Jira Projects API Error

    if (response.status === 401) {
      if (userRow.jira_refresh_token) {
        try {
          const { refreshJiraToken } = await import("@/lib/jira");

          if (jiraClientId && jiraClientSecret) {
            const refreshed = await refreshJiraToken(
              userRow.jira_refresh_token,
              jiraClientId,
              jiraClientSecret
            );

            const retryResponse = await fetch(`${apiUrl}/rest/api/3/project`, {
              headers: {
                Authorization: `Bearer ${refreshed.access_token}`,
                Accept: "application/json",
              },
            });

            if (retryResponse.ok) {
              const expiresAt = new Date();
              expiresAt.setSeconds(
                expiresAt.getSeconds() + refreshed.expires_in
              );

              await supabase
                .from("users")
                .update({
                  jira_access_token: refreshed.access_token,
                  jira_refresh_token:
                    refreshed.refresh_token || userRow.jira_refresh_token,
                  jira_token_expires_at: expiresAt.toISOString(),
                })
                .eq("id", userId);

              const retryProjects =
                (await retryResponse.json()) as JiraProjectSummary[];

              const retryBoards = retryProjects.map((project) => ({
                id: parseInt(project.id) || 0,
                name: project.name,
                type: "scrum",
                location: {
                  projectId: parseInt(project.id) || 0,
                  projectName: project.name,
                  projectKey: project.key,
                },
              }));

              return NextResponse.json({
                boards: retryBoards,
                total: retryProjects.length,
                jiraBaseUrl: jiraBaseUrl,
              });
            } else {
              // Retry başarısız, hata detaylarını logla
              const retryErrorText = await retryResponse.text();
              // Token refresh sonrası projects API hala 401
              throw new Error(
                `Token refresh sonrası projects API hala ${retryResponse.status} hatası: ${retryErrorText}`
              );
            }
          } else {
            throw new Error(
              "Jira OAuth configuration missing (CLIENT_ID or CLIENT_SECRET)"
            );
          }
        } catch (refreshError) {
          // Token refresh başarısız
          const errorMessage =
            refreshError instanceof Error
              ? refreshError.message
              : "Token refresh denemesi başarısız oldu";
          return NextResponse.json(
            {
              error:
                "Jira API erişim hatası: Token geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.",
              details: errorMessage,
              suggestion:
                "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın.",
            },
            { status: 401 }
          );
        }
      }

      return NextResponse.json(
        errorJson || {
          error:
            errorText ||
            `Jira API error: ${response.status} ${response.statusText}`,
          rawResponse: errorText,
        },
        { status: response.status }
      );
    }
    if (response.status === 403) {
      // Jira'dan gelen GERÇEK hatayı direkt döndür
      return NextResponse.json(
        errorJson || {
          error:
            errorText ||
            `Jira API error: ${response.status} ${response.statusText}`,
          rawResponse: errorText,
        },
        { status: 403 }
      );
    }
    if (response.status === 404) {
      return NextResponse.json(
        {
          error: "Jira instance bulunamadı. Jira URL'inizi kontrol edin veya Jira instance'ı geçici olarak kullanılamıyor olabilir.",
        },
        { status: 404 }
      );
    }
    
    const errorMessage = errorJson?.errorMessages?.[0] || errorJson?.error || errorJson?.message || "Jira API hatası oluştu. Lütfen tekrar deneyin.";
    return NextResponse.json(
      { error: formatErrorMessage(errorMessage) },
      { status: response.status }
    );
  }

  // REST API v3 /rest/api/3/project endpoint'i projeleri döndürür (array)
  const projects = (await response.json()) as JiraProjectSummary[];

  if (jiraBaseUrl && userId) {
    try {
      await supabase
        .from("users")
        .update({ jira_base_url: jiraBaseUrl })
        .eq("id", userId);
    } catch {
      // Jira URL save error
    }
  }

  const boards = projects.map((project) => ({
    id: parseInt(project.id) || 0,
    name: project.name,
    type: "scrum",
    location: {
      projectId: parseInt(project.id) || 0,
      projectName: project.name,
      projectKey: project.key,
    },
  }));

  return NextResponse.json({
    boards,
    total: projects.length,
    jiraBaseUrl,
    note: "Agile API scope'ları mevcut olmadığı için projeler döndürülüyor",
  });
}
