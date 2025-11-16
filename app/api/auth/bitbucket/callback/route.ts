import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabase, getSupabaseServer } from "@/lib/supabase";

interface BitbucketTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  scopes: string;
}

interface BitbucketUserResponse {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  links: {
    avatar: {
      href: string;
    };
  };
}

/**
 * Bitbucket OAuth callback handler
 * Authorization code'u access token'a çevirir ve kullanıcının Bitbucket bilgilerini kaydeder
 */
export async function GET(request: Request) {
  console.log("🔵 Bitbucket OAuth callback başladı");
  console.log("🔵 Request URL:", request.url);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const clientId = process.env.BITBUCKET_CLIENT_ID;
  const clientSecret = process.env.BITBUCKET_CLIENT_SECRET;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/app/account?error=${encodeURIComponent("Bitbucket OAuth hatası")}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/app/account?error=${encodeURIComponent("Eksik OAuth parametreleri")}`
    );
  }

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/app/account?error=${encodeURIComponent("OAuth yapılandırma hatası")}`
    );
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("bitbucket_oauth_state")?.value;
  const returnUrl = cookieStore.get("bitbucket_oauth_return_url")?.value || "/app/account";
  
  // State'ten user ID'yi decode et
  // State formatı: {randomState}:{userId} (base64 encode edilmiş)
  let userIdFromState: string | undefined;
  const stateParts = state.split(":");
  if (stateParts.length === 2) {
    try {
      userIdFromState = Buffer.from(stateParts[1], "base64").toString();
      console.log("✅ State'ten user ID decode edildi:", { userId: userIdFromState?.substring(0, 20) + "..." });
    } catch (decodeError) {
      console.warn("⚠️ State decode hatası:", decodeError);
    }
  }
  
  // State güvenlik kontrolü - sadece randomState kısmını kontrol et
  const randomStateFromUrl = stateParts[0];
  console.log("🍪 Cookie kontrolü:", {
    hasState: !!storedState,
    stateMatch: storedState === randomStateFromUrl,
    returnUrl,
    hasUserIdInState: !!userIdFromState,
  });

  if (!storedState || storedState !== randomStateFromUrl) {
    return NextResponse.redirect(
      `${appUrl}/app/account?error=${encodeURIComponent("Geçersiz state")}`
    );
  }

  try {
    // 1. Authorization code'u access token'a çevir
    const redirectUri = `${appUrl}/api/auth/bitbucket/callback`;
    const tokenResponse = await fetch(
      "https://bitbucket.org/site/oauth2/access_token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: redirectUri,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(
        `Token exchange başarısız: ${tokenResponse.status} ${tokenResponse.statusText}`
      );
    }

    const tokenData = (await tokenResponse.json()) as BitbucketTokenResponse;

    // 2. Bitbucket kullanıcı bilgilerini al
    const userResponse = await fetch("https://api.bitbucket.org/2.0/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error("Kullanıcı bilgileri alınamadı");
    }

    const bitbucketUser = (await userResponse.json()) as BitbucketUserResponse;

    // 3. Mevcut kullanıcıyı bul (cookie'den veya returnUrl'den)
    // Server-side'da service role key kullan (RLS policy'leri bypass etmek için)
    // Eğer service role key yoksa, anon key kullan (ama RLS policy sorunu olabilir)
    let supabase;
    try {
      supabase = getSupabaseServer();
      console.log("✅ Service role key ile Supabase client oluşturuldu");
    } catch (serviceError) {
      console.warn("⚠️ Service role key bulunamadı, anon key kullanılıyor:", serviceError);
      supabase = getSupabase();
    }
    let currentUserId: string | undefined;

    // Yöntem 0: State'ten decode edilen user ID'yi kullan
    if (userIdFromState) {
      currentUserId = userIdFromState;
      console.log("✅ State'ten kullanıcı bulundu:", { 
        userId: currentUserId?.substring(0, 20) + "...",
        fullUserId: currentUserId,
      });
    }

    // Yöntem 1: Cookie'den access token'ı al ve JWT'yi decode et
    if (!currentUserId) {
      const accessToken = cookieStore.get("sb-access-token")?.value;
      console.log("🔍 Cookie kontrolü:", {
        hasAccessToken: !!accessToken,
        accessTokenLength: accessToken?.length,
        returnUrl,
      });
      
      if (accessToken) {
        try {
          const tokenParts = accessToken.split(".");
          if (tokenParts.length === 3) {
            const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
            currentUserId = payload.sub;
            console.log("✅ JWT'den kullanıcı bulundu:", { userId: currentUserId?.substring(0, 20) + "..." });
          } else {
            console.warn("⚠️ JWT formatı geçersiz:", { parts: tokenParts.length });
          }
        } catch (tokenError) {
          console.warn("⚠️ JWT decode hatası:", tokenError);
        }
      } else {
        console.warn("⚠️ sb-access-token cookie bulunamadı");
      }
    }

    // Yöntem 2: Eğer JWT'den alınamadıysa, Supabase API'sine istek yap
    const accessToken = cookieStore.get("sb-access-token")?.value;
    if (!currentUserId && accessToken) {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        console.log("🔄 Supabase API'ye istek yapılıyor...");
        const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          },
        });
        
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUserId = userData.id;
          console.log("✅ API'den kullanıcı bulundu:", { userId: currentUserId?.substring(0, 20) + "..." });
        } else {
          console.warn("⚠️ API isteği başarısız:", { status: userResponse.status, statusText: userResponse.statusText });
        }
      } catch (apiError) {
        console.warn("⚠️ API'den kullanıcı alınamadı:", apiError);
      }
    }

    // Yöntem 3: Eğer hala alınamadıysa, returnUrl'den kontrol et
    // Eğer returnUrl /app/ ile başlıyorsa, kullanıcı login demektir
    // Bu durumda Bitbucket email'i ile users tablosunda arama yap
    if (!currentUserId && returnUrl.startsWith("/app/")) {
      try {
        console.log("🔄 Bitbucket email ile kullanıcı aranıyor...");
        // Bitbucket email'ini al
        const emailResponse = await fetch(
          "https://api.bitbucket.org/2.0/user/emails",
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          }
        );
        
        if (emailResponse.ok) {
          const emailData = (await emailResponse.json()) as {
            values: Array<{ email: string; is_primary: boolean }>;
          };
          const primaryEmail = emailData.values.find((e) => e.is_primary);
          const bitbucketEmail = primaryEmail?.email || emailData.values[0]?.email;
          
          console.log("📧 Bitbucket email:", bitbucketEmail);
          
          if (bitbucketEmail) {
            // Email ile users tablosunda arama yap
            const { data: existingUserByEmail } = await supabase
              .from("users")
              .select("id, email")
              .eq("email", bitbucketEmail)
              .maybeSingle();
            
            if (existingUserByEmail) {
              currentUserId = existingUserByEmail.id;
              console.log("✅ Email ile kullanıcı bulundu:", { userId: currentUserId?.substring(0, 20) + "...", email: bitbucketEmail });
            } else {
              console.warn("⚠️ Email ile kullanıcı bulunamadı:", { email: bitbucketEmail });
            }
          }
        } else {
          console.warn("⚠️ Bitbucket email API hatası:", { status: emailResponse.status, statusText: emailResponse.statusText });
        }
      } catch (emailError) {
        console.warn("⚠️ Email ile kullanıcı bulunamadı:", emailError);
      }
    }

    // Yöntem 4: Son çare olarak getUser() ile dene (genellikle server-side'da çalışmaz)
    if (!currentUserId) {
      try {
        const { data: currentAuthUser } = await supabase.auth.getUser();
        currentUserId = currentAuthUser?.user?.id;
      } catch (getUserError) {
        console.warn("getUser() hatası:", getUserError);
      }
    }

    if (!currentUserId) {
      console.error("❌ Tüm yöntemler başarısız oldu, kullanıcı bulunamadı");
      console.error("❌ Debug bilgileri:", {
        hasAccessToken: !!accessToken,
        returnUrl,
        bitbucketUsername: bitbucketUser.username,
        bitbucketUuid: bitbucketUser.uuid,
      });
      throw new Error("Kullanıcı bulunamadı. Lütfen tekrar giriş yapın ve Bitbucket bağlantısını tekrar deneyin.");
    }
    
    console.log("✅ Kullanıcı bulundu, Bitbucket bilgileri kaydediliyor...", { userId: currentUserId.substring(0, 20) + "..." });

    // 4. Bitbucket bilgilerini users tablosuna kaydet
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

    console.log("🔄 Update başlıyor - User ID:", currentUserId.substring(0, 20) + "...");
    const { data: updateData, error: updateError } = await supabase
      .from("users")
      .update({
        bitbucket_access_token: tokenData.access_token,
        bitbucket_refresh_token: tokenData.refresh_token,
        bitbucket_token_expires_at: expiresAt.toISOString(),
        bitbucket_username: bitbucketUser.username,
        bitbucket_uuid: bitbucketUser.uuid,
      })
      .eq("id", currentUserId)
      .select("bitbucket_uuid, bitbucket_username");
    
    console.log("🔄 Update sonucu:", {
      hasData: !!updateData,
      dataLength: updateData?.length,
      error: updateError,
      errorCode: updateError?.code,
      errorMessage: updateError?.message,
      bitbucketUuid: updateData?.[0]?.bitbucket_uuid,
      bitbucketUsername: updateData?.[0]?.bitbucket_username,
      fullUpdateData: JSON.stringify(updateData),
    });

    if (updateError) {
      console.error("❌ Bitbucket update hatası:", updateError);
      throw new Error(`Bitbucket bağlantısı kaydedilemedi: ${updateError.message}`);
    }
    
    // Update başarılı ama data yoksa, users tablosunda row var mı kontrol et
    // Eğer row yoksa, önce row oluştur, sonra update yap
    if (!updateData || updateData.length === 0) {
      console.warn("⚠️ Update başarılı ama data dönmedi - users tablosunda row var mı kontrol ediliyor...");
      const { data: userCheck, error: userCheckError } = await supabase
        .from("users")
        .select("id, email, username")
        .eq("id", currentUserId)
        .maybeSingle();
      
      console.log("🔍 User row kontrolü:", {
        hasUser: !!userCheck,
        userId: userCheck?.id?.substring(0, 20) + "...",
        email: userCheck?.email,
        username: userCheck?.username,
        error: userCheckError,
      });
      
      if (!userCheck) {
        console.log("⚠️ Users tablosunda row yok, oluşturuluyor...");
        // Row yoksa, önce oluştur
        // Email'i almak için auth.users tablosundan çek veya Bitbucket email'ini kullan
        let userEmail = "";
        try {
          // Auth.users tablosundan email al (service role key ile)
          const { data: authUser } = await supabase.auth.admin.getUserById(currentUserId);
          userEmail = authUser?.user?.email || "";
        } catch (authError) {
          console.warn("⚠️ Auth.users'dan email alınamadı:", authError);
        }
        
        // Eğer email yoksa, Bitbucket email'ini kullan
        if (!userEmail) {
          try {
            const emailResponse = await fetch(
              "https://api.bitbucket.org/2.0/user/emails",
              {
                headers: {
                  Authorization: `Bearer ${tokenData.access_token}`,
                },
              }
            );
            if (emailResponse.ok) {
              const emailData = (await emailResponse.json()) as {
                values: Array<{ email: string; is_primary: boolean }>;
              };
              const primaryEmail = emailData.values.find((e) => e.is_primary);
              userEmail = primaryEmail?.email || emailData.values[0]?.email || "";
            }
          } catch (emailError) {
            console.warn("⚠️ Bitbucket email alınamadı:", emailError);
          }
        }
        
        // Row oluştur
        // Kullanıcı sadece Bitbucket bağlantısı yapıyor, username'i değiştirmiyoruz
        // Username'i email'den oluştur (Bitbucket username'inden değil)
        let finalUsername = userEmail?.split("@")[0] || "user";
        
        // Username unique constraint hatası alabiliriz, bu yüzden önce unique bir username oluştur
        let usernameAttempts = 0;
        let insertError = null;
        do {
          if (usernameAttempts > 0) {
            finalUsername = `${userEmail?.split("@")[0] || "user"}_${usernameAttempts}`;
          }
          
          const { error: insertErr } = await supabase
            .from("users")
            .insert({
              id: currentUserId,
              email: userEmail || `${currentUserId}@user.local`,
              username: finalUsername, // Email'den oluşturulmuş username
              bitbucket_access_token: tokenData.access_token,
              bitbucket_refresh_token: tokenData.refresh_token,
              bitbucket_token_expires_at: expiresAt.toISOString(),
              bitbucket_username: bitbucketUser.username, // Bitbucket username'i ayrı kolonda
              bitbucket_uuid: bitbucketUser.uuid,
              created_at: new Date().toISOString(),
            });
          
          insertError = insertErr;
          usernameAttempts++;
          
          // Eğer unique constraint hatası değilse, döngüden çık
          if (insertError && !insertError.message?.includes("users_username_key") && !insertError.message?.includes("duplicate key")) {
            break;
          }
        } while (insertError && insertError.message?.includes("users_username_key") && usernameAttempts < 10);
        
        if (insertError) {
          console.error("❌ User row oluşturma hatası:", insertError);
          throw new Error(`Kullanıcı kaydı oluşturulamadı: ${insertError.message}`);
        }
        
        console.log(`✅ User row oluşturuldu (username: ${finalUsername}, bitbucket_username: ${bitbucketUser.username})`);
        
        console.log("✅ User row oluşturuldu, Bitbucket bilgileri kaydedildi");
      } else {
        // Row var ama update çalışmadı - tekrar dene
        console.warn("⚠️ Row var ama update çalışmadı, tekrar deneniyor...");
        const { data: retryUpdateData, error: retryUpdateError } = await supabase
          .from("users")
          .update({
            bitbucket_access_token: tokenData.access_token,
            bitbucket_refresh_token: tokenData.refresh_token,
            bitbucket_token_expires_at: expiresAt.toISOString(),
            bitbucket_username: bitbucketUser.username,
            bitbucket_uuid: bitbucketUser.uuid,
          })
          .eq("id", currentUserId)
          .select("bitbucket_uuid, bitbucket_username");
        
        if (retryUpdateError) {
          console.error("❌ Retry update hatası:", retryUpdateError);
          throw new Error(`Bitbucket bağlantısı güncellenemedi: ${retryUpdateError.message}`);
        }
        
        if (retryUpdateData && retryUpdateData.length > 0) {
          console.log("✅ Retry update başarılı");
          // updateData'yı güncelle
          updateData.length = 0;
          updateData.push(...retryUpdateData);
        }
      }
    }

    console.log("✅ Bitbucket bilgileri başarıyla kaydedildi:", {
      userId: currentUserId.substring(0, 20) + "...",
      fullUserId: currentUserId,
      updateData: updateData?.[0],
      bitbucketUuid: updateData?.[0]?.bitbucket_uuid,
      bitbucketUsername: updateData?.[0]?.bitbucket_username,
      rowCount: updateData?.length,
    });
    
    // Update başarılı ama select sonucu boşsa, manuel kontrol et
    if (!updateData || updateData.length === 0) {
      console.warn("⚠️ Update başarılı ama select sonucu boş - RLS policy sorunu olabilir");
      console.warn("⚠️ Update query sonucu:", { updateData, updateError, rowCount: updateData?.length });
      
      // Manuel kontrol için bir daha select yap (farklı bir yöntemle)
      const { data: verifyData, error: verifyError } = await supabase
        .from("users")
        .select("bitbucket_uuid, bitbucket_username, id")
        .eq("id", currentUserId)
        .maybeSingle();
      
      console.log("🔍 Manuel doğrulama:", {
        userId: currentUserId.substring(0, 20) + "...",
        hasData: !!verifyData,
        bitbucketUuid: verifyData?.bitbucket_uuid,
        bitbucketUsername: verifyData?.bitbucket_username,
        error: verifyError,
        errorCode: verifyError?.code,
        errorMessage: verifyError?.message,
        errorDetails: verifyError?.details,
        errorHint: verifyError?.hint,
      });
      
      // Eğer verifyData varsa, update gerçekten başarılı demektir
      if (verifyData?.bitbucket_uuid) {
        console.log("✅ Manuel doğrulama başarılı - Bitbucket bilgileri kayıtlı");
      } else {
        console.error("❌ Manuel doğrulama başarısız - Update gerçekten başarısız olmuş olabilir");
      }
    } else {
      console.log("✅ Update ve select başarılı - Bitbucket bilgileri kayıtlı");
    }

    // 5. Cookie'leri temizle ve yönlendir (success parametresi ile)
    const decodedReturnUrl = decodeURIComponent(returnUrl);
    const finalUrl = decodedReturnUrl.startsWith("/") ? decodedReturnUrl : "/app/account";
    // Success parametresi ekle - account sayfası bunu görünce veriyi yeniden çekecek
    const redirectUrl = `${appUrl}${finalUrl}?bitbucket_connected=true`;
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete("bitbucket_oauth_state");
    response.cookies.delete("bitbucket_oauth_return_url");

    return response;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "OAuth hatası";
    return NextResponse.redirect(
      `${appUrl}/app/account?error=${encodeURIComponent(errorMessage)}`
    );
  }
}

