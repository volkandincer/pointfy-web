import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";
import type {
  JiraAccessibleResource,
  JiraApiErrorResponse,
} from "@/interfaces/Jira.interface";

/**
 * Jira API bağlantısını test et
 * Jira OAuth token'ının geçerli olup olmadığını kontrol eder
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
          } catch (error) {
            console.warn("JWT decode başarısız:", error);
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

    if (!userRow.jira_access_token) {
      return NextResponse.json(
        { error: "Jira not connected. Please connect your Jira account first." },
        { status: 400 }
      );
    }

    const jiraBaseUrl = searchParams.get("jiraBaseUrl") || userRow.jira_base_url;
    if (!jiraBaseUrl) {
      return NextResponse.json(
        { error: "Jira URL not provided" },
        { status: 400 }
      );
    }

    // Jira URL'ini normalize et
    let jiraUrl = jiraBaseUrl;
    if (!jiraUrl.startsWith("http")) {
      jiraUrl = `https://${jiraUrl}`;
    }
    if (jiraUrl.endsWith("/")) {
      jiraUrl = jiraUrl.slice(0, -1);
    }

    // 3. Jira token ile Jira API'ye test isteği yap
    console.log("🔍 Jira Connection Test başladı:", {
      userId: userId?.substring(0, 20) + "...",
      jiraUrl,
      hasToken: !!userRow.jira_access_token,
      tokenExpired: userRow.jira_token_expires_at 
        ? new Date(userRow.jira_token_expires_at) < new Date()
        : false,
    });

    const testResults = {
      jiraToken: {
        valid: !!userRow.jira_access_token,
        expiresAt: userRow.jira_token_expires_at,
        expired: userRow.jira_token_expires_at 
          ? new Date(userRow.jira_token_expires_at) < new Date()
          : false,
      },
      jiraUrl: jiraUrl,
      tests: [] as Array<{ endpoint: string; status: number; success: boolean; message: string }>,
    };

    // Test 1: Accessible Resources (OAuth 3LO için cloudId almak için)
    try {
      console.log("📡 Test 1: Accessible Resources endpoint test ediliyor...");
      const accessibleResourcesResponse = await fetch(
        "https://api.atlassian.com/oauth/token/accessible-resources",
        {
          headers: {
            Authorization: `Bearer ${userRow.jira_access_token}`,
            Accept: "application/json",
          },
        }
      );

      const responseText = await accessibleResourcesResponse.text();
      let responseJson: JiraAccessibleResource[] | null = null;
      try {
        responseJson = JSON.parse(responseText) as JiraAccessibleResource[];
      } catch {
        // JSON parse başarısız
      }

      console.log("📥 Test 1 Response:", {
        status: accessibleResourcesResponse.status,
        statusText: accessibleResourcesResponse.statusText,
        responseLength: responseText.length,
        firstChars: responseText.substring(0, 200),
      });

      testResults.tests.push({
        endpoint: "Accessible Resources (OAuth 3LO)",
        status: accessibleResourcesResponse.status,
        success: accessibleResourcesResponse.ok,
        message: accessibleResourcesResponse.ok 
          ? "Token geçerli, accessible resources alındı"
          : accessibleResourcesResponse.status === 401
          ? "Token geçersiz veya süresi dolmuş"
          : `Beklenmeyen hata: ${
              responseJson
                ? JSON.stringify(responseJson).substring(0, 120)
                : accessibleResourcesResponse.statusText
            }`,
      });
    } catch (error) {
      console.error("❌ Test 1 Error:", error);
      testResults.tests.push({
        endpoint: "Accessible Resources (OAuth 3LO)",
        status: 0,
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      });
    }

    // Test 2: Jira /rest/agile/1.0/board endpoint (cloudId ile)
    try {
      console.log("📡 Test 2: Jira /rest/agile/1.0/board endpoint test ediliyor...");
      
      // Önce cloudId'yi al
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
        // CloudId alınamadı, direkt URL kullanılacak
      }

      const apiUrl = cloudId 
        ? `https://api.atlassian.com/ex/jira/${cloudId}`
        : jiraUrl;

      const boardResponse = await fetch(`${apiUrl}/rest/agile/1.0/board`, {
        headers: {
          Authorization: `Bearer ${userRow.jira_access_token}`,
          Accept: "application/json",
        },
      });

      const responseText = await boardResponse.text();
      let responseJson: JiraApiErrorResponse | null = null;
      try {
        responseJson = JSON.parse(responseText) as JiraApiErrorResponse;
      } catch {
        // JSON parse başarısız
      }

      console.log("📥 Test 2 Response:", {
        status: boardResponse.status,
        statusText: boardResponse.statusText,
        cloudId: cloudId || "not found",
        apiUrl,
        responseLength: responseText.length,
        firstChars: responseText.substring(0, 200),
        errorMessage: responseJson?.errorMessage || responseJson?.message || null,
      });

      testResults.tests.push({
        endpoint: "/rest/agile/1.0/board",
        status: boardResponse.status,
        success: boardResponse.ok,
        message: boardResponse.ok
          ? "Agile API erişimi başarılı"
          : boardResponse.status === 401
          ? `Token geçersiz veya süresi dolmuş: ${responseJson?.errorMessage || boardResponse.statusText}`
          : boardResponse.status === 403
          ? `Agile API erişim izni yok: ${responseJson?.errorMessage || "Forbidden"}`
          : `Beklenmeyen hata: ${responseJson?.errorMessage || boardResponse.statusText}`,
      });
    } catch (error) {
      console.error("❌ Test 2 Error:", error);
      testResults.tests.push({
        endpoint: "/rest/agile/1.0/board",
        status: 0,
        success: false,
        message: error instanceof Error ? error.message : "Network error",
      });
    }

    // Analiz: Hangi testler başarılı/başarısız?
    const allTestsFailed = testResults.tests.every(t => !t.success);
    const allTests401 = testResults.tests.every(t => t.status === 401);

    let recommendation = "";
    if (allTestsFailed && allTests401) {
      recommendation = "⚠️ Jira token'ı geçersiz veya süresi dolmuş. Lütfen Jira bağlantınızı yenileyin.";
    } else if (allTestsFailed) {
      recommendation = "⚠️ Jira API'ye erişim başarısız. Jira URL'inizi ve token'ınızı kontrol edin.";
    } else {
      recommendation = "✅ Bağlantı testi tamamlandı. Tüm testler başarılı!";
    }

    const finalResult = {
      success: testResults.tests.some(t => t.success),
      results: testResults,
      recommendation,
      analysis: {
        allTestsFailed,
        allTests401,
        testCount: testResults.tests.length,
        successfulTests: testResults.tests.filter(t => t.success).length,
      },
    };

    console.log("✅ Test tamamlandı:", {
      success: finalResult.success,
      testsCount: testResults.tests.length,
      successfulTests: testResults.tests.filter(t => t.success).length,
      recommendation: finalResult.recommendation,
    });

    return NextResponse.json(finalResult);
  } catch (error) {
    console.error("Jira connection test error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
