import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import { jiraConfig } from "@/lib/jiraConfig";
import type {
  JiraAccessibleResource,
  JiraApiErrorResponse,
  JiraProjectSummary,
} from "@/interfaces/Jira.interface";

const isJiraApiErrorResponse = (
  value: unknown
): value is JiraApiErrorResponse => typeof value === "object" && value !== null;

const { clientId: jiraClientId, clientSecret: jiraClientSecret } = jiraConfig;
/**
 * Jira Board'larını getir
 * Jira OAuth token'ı kullanarak Jira API'ye erişir
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let userId: string | undefined = searchParams.get("userId") || undefined;

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
            console.warn(
              "JWT decode başarısız, Supabase API isteği yapılacak:",
              error
            );
          }
        }

        if (!userId && accessToken) {
          try {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              },
            });

            if (userResponse.ok) {
              const userData = await userResponse.json();
              userId = userData.id;
            }
          } catch (apiError) {
            console.error("Supabase API error:", apiError);
          }
        }

        if (!userId) {
          const supabase = getSupabase();
          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser();

          if (!userError && user) {
            userId = user.id;
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
      console.error("User fetch error:", userError);
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
  } catch (error) {
    console.error("Jira boards API error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
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

  if (tokenExpiresAt && tokenExpiresAt < new Date()) {
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
      console.error("❌ Jira token refresh error:", refreshError);
      const errorMessage =
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh token";
      return NextResponse.json(
        {
          error:
            "Jira token expired and refresh failed. Please reconnect Jira.",
          details: errorMessage,
        },
        { status: 401 }
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const jiraBaseUrl =
    searchParams.get("jiraBaseUrl") ||
    userRow.jira_base_url ||
    process.env.JIRA_BASE_URL;

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
      const errorText = await accessibleResourcesResponse.text();
      let errorDetails = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (isJiraApiErrorResponse(parsed)) {
          errorDetails = parsed.errorMessage || parsed.message || errorText;
        }
      } catch {
        // JSON parse failed
      }

      console.error("❌ Accessible resources hatası:", {
        status: accessibleResourcesResponse.status,
        statusText: accessibleResourcesResponse.statusText,
        errorDetails,
        tokenLength: jiraToken?.length,
        tokenPreview: jiraToken?.substring(0, 20) + "...",
      });

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
                console.error("❌ Token refresh sonrası hala 401:", {
                  status: retryResponse.status,
                  errorText: retryErrorText,
                });
                throw new Error(
                  `Token refresh sonrası hala 401 hatası: ${retryErrorText}`
                );
              }
            } else {
              throw new Error("Jira OAuth configuration missing");
            }
          } catch (refreshError) {
            console.error("❌ Token refresh başarısız:", {
              error: refreshError,
              message:
                refreshError instanceof Error
                  ? refreshError.message
                  : "Unknown error",
              stack:
                refreshError instanceof Error ? refreshError.stack : undefined,
            });
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
  } catch (error) {
    console.error("❌ CloudId alınamadı:", error);
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

    // Jira'dan gelen GERÇEK hatayı logla
    console.error(
      "❌ Jira Projects API Error - Jira'dan gelen GERÇEK hata (Agile API yerine REST API v3 kullanılıyor):",
      {
        status: response.status,
        statusText: response.statusText,
        apiUrl,
        endpoint: `${apiUrl}/rest/api/3/project`,
        rawErrorText: errorText,
        parsedErrorJson: errorJson,
        cloudId: cloudId || "not found",
        responseUrl: response.url,
        headers: Object.fromEntries(response.headers.entries()),
      }
    );

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
              console.error("❌ Token refresh sonrası projects API hala 401:", {
                status: retryResponse.status,
                statusText: retryResponse.statusText,
                errorText: retryErrorText,
                apiUrl,
                endpoint: `${apiUrl}/rest/api/3/project`,
              });
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
          console.error("Token refresh başarısız:", refreshError);
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
          error: `Jira instance bulunamadı: ${
            jiraBaseUrl || "cloudId: " + (cloudId || "not found")
          }`,
          details:
            errorDetails ||
            "Jira URL'i yanlış olabilir veya Jira instance'ı geçici olarak kullanılamıyor.",
          suggestion: cloudId
            ? `CloudId bulundu ama API erişimi başarısız. Kullandığımız URL: ${apiUrl}\n\nOAuth 2.0 (3LO) için doğru format kullanılıyor.`
            : `CloudId bulunamadı. Kullandığımız URL: ${apiUrl}\n\nDoğru Jira URL'inizi manuel olarak girin (örn: pointf.atlassian.net)`,
          apiUrl: apiUrl,
          jiraBaseUrl: jiraBaseUrl,
          cloudId: cloudId || "not found",
        },
        { status: 404 }
      );
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

  // REST API v3 /rest/api/3/project endpoint'i projeleri döndürür (array)
  const projects = (await response.json()) as JiraProjectSummary[];

  if (jiraBaseUrl && userId) {
    try {
      await supabase
        .from("users")
        .update({ jira_base_url: jiraBaseUrl })
        .eq("id", userId);
    } catch (saveError) {
      console.error("Jira URL save error:", saveError);
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
