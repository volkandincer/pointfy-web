import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";

/**
 * Jira URL'ini veritabanına kaydet
 */
export async function POST(request: Request) {
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

    // 2. Request body'den Jira URL'ini al
    const body = await request.json();
    const jiraBaseUrl = body.jiraBaseUrl?.trim();

    if (!jiraBaseUrl) {
      return NextResponse.json(
        { error: "Jira URL is required" },
        { status: 400 }
      );
    }

    // URL'i normalize et
    let normalizedUrl = jiraBaseUrl;
    if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://")) {
      normalizedUrl = normalizedUrl.replace(/^https?:\/\//, "");
    }
    if (normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    // 3. URL'i veritabanına kaydet
    let supabase;
    try {
      supabase = getSupabaseServer();
    } catch {
      supabase = getSupabase();
    }

    const { error: updateError } = await supabase
      .from("users")
      .update({ jira_base_url: normalizedUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Jira URL save error:", updateError);
      return NextResponse.json(
        { error: `Failed to save Jira URL: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jiraBaseUrl: normalizedUrl,
      message: "Jira URL saved successfully",
    });
  } catch (error) {
    console.error("Save Jira URL API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}


