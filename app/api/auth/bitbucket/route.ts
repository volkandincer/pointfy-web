import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase } from "@/lib/supabase";

/**
 * Bitbucket OAuth başlatma endpoint'i
 * Kullanıcıyı Bitbucket OAuth sayfasına yönlendirir
 */
export async function GET(request: Request) {
  const clientId = process.env.BITBUCKET_CLIENT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const returnUrl = searchParams.get("returnUrl") || "/app/account";
  const userIdFromQuery = searchParams.get("userId"); // Client-side'dan gelen user ID

  if (!clientId) {
    return NextResponse.json(
      { error: "Bitbucket OAuth yapılandırılmamış" },
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
          const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
          currentUserId = payload.sub;
        }
      } catch (tokenError) {
        // JWT decode başarısız
      }
    }

    // Eğer JWT'den alınamadıysa, Supabase API'sine istek yap
    if (!currentUserId && accessToken) {
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
          currentUserId = userData.id;
        }
      } catch (apiError) {
        // API isteği başarısız
      }
    }
  }
  
  console.log("🔍 OAuth başlatma - User ID:", {
    fromQuery: !!userIdFromQuery,
    fromCookie: !userIdFromQuery && !!currentUserId,
    userId: currentUserId?.substring(0, 20) + "...",
  });

  // OAuth state oluştur - user ID'yi state'e encode et
  const randomState = Math.random().toString(36).substring(2, 15);
  // State formatı: {randomState}:{userId} (base64 encode edilmiş)
  const statePayload = currentUserId 
    ? `${randomState}:${Buffer.from(currentUserId).toString("base64")}`
    : randomState;
  
  const redirectUri = `${appUrl}/api/auth/bitbucket/callback`;

  const authUrl = new URL("https://bitbucket.org/site/oauth2/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", statePayload);

  const response = NextResponse.redirect(authUrl.toString());
  // State'in ilk kısmını (randomState) cookie'de sakla (güvenlik kontrolü için)
  response.cookies.set("bitbucket_oauth_state", randomState, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 dakika
  });
  response.cookies.set("bitbucket_oauth_return_url", returnUrl, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 dakika
  });

  return response;
}

