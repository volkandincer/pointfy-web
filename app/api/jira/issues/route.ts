import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import type { JiraSearchResponse, JiraTask } from "@/interfaces/Jira.interface";

/**
 * Jira Issue'larını getir (kullanıcıya assign edilmiş)
 * Jira OAuth token'ı kullanarak Jira API'ye erişir
 */
export async function GET(request: Request) {
  try {
    // 1. Kullanıcıyı doğrula
    const { searchParams } = new URL(request.url);
    let userId: string | undefined = searchParams.get("userId") || undefined;
    
    // Eğer query'den alınamadıysa, cookie'den deneyelim
    if (!userId) {
      try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get("sb-access-token")?.value;
        
        if (accessToken) {
          try {
            const tokenParts = accessToken.split(".");
            if (tokenParts.length === 3) {
              const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
              userId = payload.sub;
            }
          } catch (tokenError) {
            // JWT decode başarısız, Supabase API'ye istek yap
            console.log("JWT decode failed, trying Supabase API...");
          }
        }
        
        // Eğer JWT'den alınamadıysa, Supabase API'sine istek yap
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
        
        // Son çare: Supabase client ile getUser()
        if (!userId) {
          const supabase = getSupabase();
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
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

    // 2. Jira token'ı al
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

    if (userError || !userRow) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Jira token kontrolü
    if (!userRow.jira_access_token) {
      return NextResponse.json(
        { 
          error: "Jira bağlantısı gerekli. Lütfen Jira hesabınızı bağlayın.",
          suggestion: "Jira sayfasından 'Connect Jira' butonuna tıklayarak Jira hesabınızı bağlayın."
        },
        { status: 400 }
      );
    }

    // Jira token ile istek yap
    return await handleJiraIssuesRequestWithJiraToken(userRow, request, userId);
  } catch (error) {
    console.error("Jira issues API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Jira token ile Jira Issues API'ye istek yap
 */
async function handleJiraIssuesRequestWithJiraToken(
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

  // Token'ın geçerliliğini kontrol et ve refresh et (gerekirse)
  let jiraToken = userRow.jira_access_token;
  const tokenExpiresAt = userRow.jira_token_expires_at 
    ? new Date(userRow.jira_token_expires_at)
    : null;

  // Token süresi dolmuşsa refresh et
  if (tokenExpiresAt && tokenExpiresAt < new Date()) {
    if (!userRow.jira_refresh_token) {
      return NextResponse.json(
        { error: "Jira token expired and no refresh token available. Please reconnect Jira." },
        { status: 401 }
      );
    }

    try {
      const { refreshJiraToken } = await import("@/lib/jira");
      const clientId = process.env.JIRA_CLIENT_ID;
      const clientSecret = process.env.JIRA_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Jira OAuth configuration missing" },
          { status: 500 }
        );
      }

      const refreshed = await refreshJiraToken(
        userRow.jira_refresh_token,
        clientId,
        clientSecret
      );

      jiraToken = refreshed.access_token;

      // Token'ı veritabanına kaydet
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

      console.log("✅ Jira token refreshed successfully");
    } catch (refreshError) {
      console.error("❌ Jira token refresh error:", refreshError);
      const errorMessage = refreshError instanceof Error ? refreshError.message : "Failed to refresh token";
      return NextResponse.json(
        { 
          error: "Jira token expired and refresh failed. Please reconnect Jira.",
          details: errorMessage
        },
        { status: 401 }
      );
    }
  }

  // Jira base URL ve query parametrelerini al
  const { searchParams } = new URL(request.url);
  let jiraBaseUrl = searchParams.get("jiraBaseUrl") || userRow.jira_base_url || process.env.JIRA_BASE_URL;
  const boardId = searchParams.get("boardId");
  const status = searchParams.get("status");
  const maxResults = parseInt(searchParams.get("maxResults") || "50");

  if (!jiraBaseUrl) {
    return NextResponse.json(
      { error: "Jira base URL could not be determined. Please provide it manually." },
      { status: 400 }
    );
  }

  // OAuth 2.0 (3LO) için cloudId'yi al ve API URL'ini oluştur
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
      // 401 hatası alıyorsak, token geçersiz demektir
      // Önce token'ı refresh etmeyi dene
      if (accessibleResourcesResponse.status === 401) {
        console.log("⚠️ Accessible resources 401 hatası - Token refresh deneniyor...");
        
        // Token refresh mekanizması
        if (userRow.jira_refresh_token) {
          try {
            const { refreshJiraToken } = await import("@/lib/jira");
            const clientId = process.env.JIRA_CLIENT_ID;
            const clientSecret = process.env.JIRA_CLIENT_SECRET;

            if (clientId && clientSecret) {
              const refreshed = await refreshJiraToken(
                userRow.jira_refresh_token,
                clientId,
                clientSecret
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
                expiresAt.setSeconds(expiresAt.getSeconds() + refreshed.expires_in);

                await supabase
                  .from("users")
                  .update({
                    jira_access_token: refreshed.access_token,
                    jira_refresh_token: refreshed.refresh_token || userRow.jira_refresh_token,
                    jira_token_expires_at: expiresAt.toISOString(),
                  })
                  .eq("id", userId);

                console.log("✅ Token refresh başarılı, accessible resources tekrar deneniyor...");
                jiraToken = refreshed.access_token;
                
                // Tekrar accessible resources al
                const resources = (await retryResponse.json()) as Array<{
                  id: string;
                  name: string;
                  url: string;
                  scopes: string[];
                  avatarUrl?: string;
                }>;
                
                const jiraResource = resources.find(
                  (r) => r.url.includes("atlassian.net") || r.name.toLowerCase().includes("jira")
                );
                
                if (jiraResource) {
                  cloudId = jiraResource.id;
                } else if (resources.length > 0) {
                  cloudId = resources[0].id;
                }
              } else {
                // Refresh sonrası hala 401, token gerçekten geçersiz
                throw new Error("Token refresh sonrası hala 401 hatası");
              }
            } else {
              throw new Error("Jira OAuth configuration missing");
            }
          } catch (refreshError) {
            console.error("❌ Token refresh başarısız:", refreshError);
            return NextResponse.json(
              { 
                error: "Jira API erişim hatası: Token geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.",
                details: "Token refresh denemesi başarısız oldu. Lütfen Jira'yı yeniden bağlayın.",
                suggestion: "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın."
              },
              { status: 401 }
            );
          }
        } else {
          // Refresh token yok, kullanıcı yeniden bağlanmalı
          return NextResponse.json(
            { 
              error: "Jira API erişim hatası: Token geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.",
              details: "Accessible resources endpoint'i 401 döndü ve refresh token mevcut değil.",
              suggestion: "Lütfen /app/account sayfasından Jira bağlantınızı koparıp tekrar bağlayın."
            },
            { status: 401 }
          );
        }
      } else {
        console.warn("⚠️ Accessible resources alınamadı, fallback URL kullanılacak:", {
          status: accessibleResourcesResponse.status,
        });
      }
    } else {
      const resources = (await accessibleResourcesResponse.json()) as Array<{
        id: string;
        name: string;
        url: string;
        scopes: string[];
        avatarUrl?: string;
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
    console.warn("⚠️ CloudId alınamadı, fallback URL kullanılacak:", error);
  }

  // OAuth 2.0 (3LO) için doğru URL formatını kullan
  let apiUrl: string;
  if (cloudId) {
    apiUrl = `https://api.atlassian.com/ex/jira/${cloudId}`;
  } else {
    // Fallback: Direkt Jira URL'i kullan
    let jiraUrl = jiraBaseUrl;
    if (!jiraUrl.startsWith("http")) {
      jiraUrl = `https://${jiraUrl}`;
    }
    if (jiraUrl.endsWith("/")) {
      jiraUrl = jiraUrl.slice(0, -1);
    }
    apiUrl = jiraUrl;
  }


  // JQL query oluştur
  let jql = "assignee=currentuser()";
  if (status === "active") {
    jql += " AND status != Done AND status != Closed";
  } else if (status === "done") {
    jql += " AND (status = Done OR status = Closed)";
  }

  // Board ID varsa, board'a ait issue'ları getir
  // Board ID ile issue fetch - /rest/api/3/search/jql endpoint'ini kullan
  if (boardId) {
    // Board ID ile issue'ları filtrelemek için JQL'e board filter ekle
    const boardJql = `${jql} AND board = ${boardId}`;
    
    // POST method ile body'de jql gönder
    // /rest/api/3/search/jql endpoint'i için sadece jql ve maxResults gerekli
    const boardResponse = await fetch(
      `${apiUrl}/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${jiraToken}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql: boardJql,
          maxResults: maxResults,
        }),
      }
    );

    if (!boardResponse.ok) {
      const errorText = await boardResponse.text();
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        // errorMessages array'i varsa onu kullan
        if (errorJson.errorMessages && Array.isArray(errorJson.errorMessages)) {
          errorDetails = JSON.stringify({
            errorMessages: errorJson.errorMessages,
            errors: errorJson.errors || {},
          });
        } else {
          errorDetails = errorJson.errorMessage || errorJson.message || errorText;
        }
      } catch {
        // JSON parse başarısız
      }


      if (boardResponse.status === 404) {
        return NextResponse.json(
          { 
            error: `Jira instance bulunamadı: ${jiraBaseUrl || "cloudId: " + (cloudId || "not found")}`,
            details: errorDetails || "Jira URL'i yanlış olabilir veya Jira instance'ı geçici olarak kullanılamıyor.",
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

      if (boardResponse.status === 410) {
        return NextResponse.json(
          { 
            error: "Jira API error: 410 Gone",
            details: errorDetails,
            apiUrl: apiUrl,
            cloudId: cloudId || "not found",
            boardId,
            suggestion: "Lütfen Jira API dokümantasyonunu kontrol edin. OAuth 3LO için endpoint formatı farklı olabilir."
          },
          { status: 410 }
        );
      }

      return NextResponse.json(
        { error: `Jira API error: ${boardResponse.status} ${boardResponse.statusText}`, details: errorDetails },
        { status: boardResponse.status }
      );
    }

    const boardData = (await boardResponse.json()) as JiraSearchResponse;
    
    const tasks: JiraTask[] = boardData.issues.map((issue) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      statusColor: issue.fields.status.statusCategory.colorName,
      assignee: issue.fields.assignee
        ? {
            name: issue.fields.assignee.displayName,
            avatar: issue.fields.assignee.avatarUrls["48x48"],
          }
        : undefined,
      priority: issue.fields.priority?.name,
      type: issue.fields.issuetype.name,
      project: {
        key: issue.fields.project.key,
        name: issue.fields.project.name,
      },
      created: issue.fields.created,
      updated: issue.fields.updated,
      resolved: issue.fields.resolutiondate,
      url: jiraBaseUrl 
        ? `https://${jiraBaseUrl}/browse/${issue.key}`
        : cloudId 
        ? `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`
        : `${apiUrl}/browse/${issue.key}`,
      boardId: parseInt(boardId),
    }));

    return NextResponse.json({
      issues: tasks,
      total: boardData.total,
    });
  }

  const searchEndpoint = `${apiUrl}/rest/api/3/search/jql`;
  const requestBody = {
    jql: jql,
    maxResults: maxResults,
  };
  
  const response = await fetch(searchEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jiraToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails = errorText;
    try {
      const errorJson = JSON.parse(errorText);
      // errorMessages array'i varsa onu kullan
      if (errorJson.errorMessages && Array.isArray(errorJson.errorMessages)) {
        errorDetails = JSON.stringify({
          errorMessages: errorJson.errorMessages,
          errors: errorJson.errors || {},
        });
      } else {
        errorDetails = errorJson.errorMessage || errorJson.message || errorText;
      }
    } catch {
      // JSON parse başarısız
    }

    console.error("Jira Issues API Error:", {
      status: response.status,
      statusText: response.statusText,
      apiUrl,
      endpoint: searchEndpoint,
      requestBody,
      errorDetails,
      cloudId: cloudId || "not found",
      responseUrl: response.url,
    });

    if (response.status === 401) {
      return NextResponse.json(
        { error: "Jira API access denied: Invalid or expired token" },
        { status: 401 }
      );
    }
    if (response.status === 403) {
      return NextResponse.json(
        { 
          error: "Jira API erişim hatası: Yetersiz yetki",
          details: "Jira token'ınız yeterli yetkiye sahip değil."
        },
        { status: 403 }
      );
    }
    if (response.status === 404) {
      return NextResponse.json(
        { 
          error: `Jira instance bulunamadı: ${jiraBaseUrl || "cloudId: " + (cloudId || "not found")}`,
          details: errorDetails || "Jira URL'i yanlış olabilir veya Jira instance'ı geçici olarak kullanılamıyor.",
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
    if (response.status === 410) {
      return NextResponse.json(
        { 
          error: "Jira API error: 410 Gone",
          details: errorDetails,
          apiUrl: apiUrl,
          endpoint: searchEndpoint,
          cloudId: cloudId || "not found",
        },
        { status: 410 }
      );
    }
    
    return NextResponse.json(
      { error: `Jira API error: ${response.status} ${response.statusText}`, details: errorDetails, apiUrl: apiUrl, cloudId: cloudId || "not found" },
      { status: response.status }
    );
  }

  const data = (await response.json()) as JiraSearchResponse;

  if (!data.issues || !Array.isArray(data.issues)) {
    return NextResponse.json(
      {
        error: "Invalid response format from Jira API",
        response: data
      },
      { status: 500 }
    );
  }

  const tasks: JiraTask[] = data.issues
    .filter((issue) => issue.fields !== undefined)
    .map((issue) => {
      if (!issue.fields) {
        // TypeScript guard - bu noktaya asla gelmemeli
        throw new Error("Issue missing fields");
      }
      return {
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description,
        status: issue.fields.status.name,
        statusColor: issue.fields.status.statusCategory.colorName,
        assignee: issue.fields.assignee
          ? {
              name: issue.fields.assignee.displayName,
              avatar: issue.fields.assignee.avatarUrls["48x48"],
            }
          : undefined,
        priority: issue.fields.priority?.name,
        type: issue.fields.issuetype.name,
        project: {
          key: issue.fields.project.key,
          name: issue.fields.project.name,
        },
        created: issue.fields.created,
        updated: issue.fields.updated,
        resolved: issue.fields.resolutiondate,
        url: jiraBaseUrl 
          ? `https://${jiraBaseUrl}/browse/${issue.key}`
          : cloudId 
          ? `https://api.atlassian.com/ex/jira/${cloudId}/browse/${issue.key}`
          : `${apiUrl}/browse/${issue.key}`,
        boardId: boardId ? parseInt(boardId) : undefined,
      };
    });

  return NextResponse.json({
    issues: tasks,
    total: data.total,
  });
}


