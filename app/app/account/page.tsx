"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getSupabase } from "@/lib/supabase";

export default function AccountPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const router = useRouter();
  const [userKey, setUserKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUsername, setEditingUsername] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [bitbucketConnected, setBitbucketConnected] = useState<boolean>(false);
  const [bitbucketUsername, setBitbucketUsername] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    async function fetchUserData() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted) return;
        
        // RequireAuth zaten kontrol ediyor, burada sadece user yoksa return et
        if (!userData.user) {
          setLoading(false);
          return;
        }

        setUserKey(userData.user.id);
        setEmail(userData.user.email || "");

        // Önce sadece username'i al (bitbucket kolonları olmayabilir)
        const { data: userRow, error: userRowError } = await supabase
          .from("users")
          .select("username")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (userRowError) {
          console.error("User row fetch error:", userRowError);
          // Eğer kayıt yoksa (PGRST116), yeni kayıt oluştur
          if (userRowError.code === "PGRST116" || userRowError.message?.includes("0 rows")) {
            const emailUsername = userData.user.email?.split("@")[0] || "User";
            // Trigger (handle_new_user) otomatik olarak public.users tablosuna insert yapıyor
            // Ama eğer row yoksa, upsert kullanarak güvenli bir şekilde oluştur
            const { error: insertError } = await supabase
              .from("users")
              .upsert({
                id: userData.user.id,
                username: emailUsername,
                email: userData.user.email || "",
                created_at: new Date().toISOString(),
              }, {
                onConflict: "id",
              });
            
            if (insertError) {
              console.error("User insert/update error:", insertError);
            } else {
              setUsername(emailUsername);
              setNewUsername(emailUsername);
            }
          }
        }

        if (userRow?.username) {
          setUsername(userRow.username);
          setNewUsername(userRow.username);
        } else if (!userRowError || userRowError.code !== "PGRST116") {
          // Sadece kayıt yoksa değil, başka bir hata varsa email'den username oluştur
          const emailUsername = userData.user.email?.split("@")[0] || "User";
          setUsername(emailUsername);
          setNewUsername(emailUsername);
        }

        // Bitbucket bağlantı durumu (kolonlar varsa kontrol et)
        try {
          console.log("🔍 Bitbucket sorgusu başlıyor - User ID:", userData.user.id.substring(0, 20) + "...");
          const { data: bitbucketRow, error: bitbucketError } = await supabase
            .from("users")
            .select("bitbucket_uuid, bitbucket_username")
            .eq("id", userData.user.id)
            .maybeSingle();

          console.log("🔍 Bitbucket bağlantı kontrolü:", {
            userId: userData.user.id.substring(0, 20) + "...",
            hasRow: !!bitbucketRow,
            hasUuid: !!bitbucketRow?.bitbucket_uuid,
            username: bitbucketRow?.bitbucket_username,
            error: bitbucketError,
            errorCode: bitbucketError?.code,
            errorMessage: bitbucketError?.message,
          });

          if (bitbucketRow?.bitbucket_uuid) {
            console.log("✅ Bitbucket bağlı - state güncelleniyor");
            setBitbucketConnected(true);
            setBitbucketUsername(bitbucketRow.bitbucket_username || "");
          } else {
            console.log("⚠️ Bitbucket bağlı değil");
            setBitbucketConnected(false);
            setBitbucketUsername("");
          }
        } catch (bitbucketError) {
          console.error("❌ Bitbucket kontrol hatası:", bitbucketError);
          // Bitbucket kolonları yoksa (migration çalıştırılmamışsa) sadece false yap
          setBitbucketConnected(false);
          setBitbucketUsername("");
        }
      } catch (err) {
        console.error("Account fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUserData();
    
    // URL'deki error ve success parametrelerini kontrol et
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const error = urlParams.get("error");
      const bitbucketConnected = urlParams.get("bitbucket_connected");
      
      if (error) {
        setErrorMessage(decodeURIComponent(error));
        // URL'den error parametresini temizle
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
      
      // Bitbucket bağlantısı başarılı olduysa, veriyi yeniden çek
      if (bitbucketConnected === "true") {
        console.log("🔄 Bitbucket bağlantısı başarılı, veri yeniden çekiliyor...");
        // URL'den parametreyi temizle
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        // Veriyi yeniden çek
        fetchUserData();
      }
    }
    
    // Sayfa focus olduğunda veya visibility change olduğunda veriyi yeniden çek
    // (OAuth callback'ten döndükten sonra state'i güncellemek için)
    const handleFocus = () => {
      if (mounted) {
        fetchUserData();
      }
    };
    
    const handleVisibilityChange = () => {
      if (mounted && !document.hidden) {
        fetchUserData();
      }
    };
    
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      mounted = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleUpdateUsername = async () => {
    if (!newUsername.trim() || newUsername === username) {
      setEditingUsername(false);
      return;
    }

    setSaving(true);
    try {
      const supabase = getSupabase();
      
      // Önce kullanıcının users tablosunda kaydı var mı kontrol et
      const { data: existingUser } = await supabase
        .from("users")
        .select("key")
        .eq("id", userKey)
        .maybeSingle();

      if (existingUser) {
        // Güncelle
        const { error } = await supabase
          .from("users")
          .update({ username: newUsername.trim() })
          .eq("id", userKey);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur (veya varsa güncelle)
        // Trigger (handle_new_user) otomatik olarak public.users tablosuna insert yapıyor
        // Ama eğer row yoksa, upsert kullanarak güvenli bir şekilde oluştur
        const { error } = await supabase
          .from("users")
          .upsert({
            id: userKey,
            username: newUsername.trim(),
            email: email, // Ensure email is also inserted
            created_at: new Date().toISOString(),
          }, {
            onConflict: "id",
          });

        if (error) throw error;
      }

      setUsername(newUsername.trim());
      setEditingUsername(false);
    } catch (err) {
      console.error("Username update error:", err);
      alert("Kullanıcı adı güncellenemedi.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      router.replace("/");
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  const handleConnectBitbucket = async () => {
    // Önce user ID'yi al (eğer userKey boşsa)
    let userId = userKey;
    if (!userId) {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user?.id) {
          userId = userData.user.id;
        }
      } catch (err) {
        console.error("User ID alınamadı:", err);
        alert("Kullanıcı bilgileri alınamadı. Lütfen sayfayı yenileyin.");
        return;
      }
    }
    
    if (!userId) {
      alert("Kullanıcı bilgileri alınamadı. Lütfen sayfayı yenileyin.");
      return;
    }
    
    // OAuth akışını başlat - returnUrl ve userId ile account sayfasına dön
    const returnUrl = encodeURIComponent("/app/account");
    const encodedUserId = encodeURIComponent(userId);
    window.location.href = `/api/auth/bitbucket?returnUrl=${returnUrl}&userId=${encodedUserId}`;
  };

  const handleDisconnectBitbucket = async () => {
    if (!confirm("Bitbucket hesabınızı bağlantıdan koparmak istediğinize emin misiniz?")) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("users")
        .update({
          bitbucket_access_token: null,
          bitbucket_refresh_token: null,
          bitbucket_token_expires_at: null,
          bitbucket_username: null,
          bitbucket_uuid: null,
        })
        .eq("id", userKey);

      if (error) throw error;

      setBitbucketConnected(false);
      setBitbucketUsername("");
      alert("Bitbucket hesabı bağlantıdan koparıldı.");
    } catch (err) {
      console.error("Bitbucket disconnect error:", err);
      alert("Bitbucket bağlantısı koparılamadı.");
    }
  };

  if (loading) {
    return (
      <RequireAuth>
        <>
          <Header navigationItems={navigationItems} />
          <main className="container mx-auto px-4 py-16">
            <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          </main>
          <Footer navigationItems={navigationItems} />
        </>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Hesabım
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Profil bilgilerinizi yönetin
              </p>
            </div>

            {/* Error mesajı (OAuth callback'ten döndükten sonra) */}
            {errorMessage && (
              <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                Hata: {errorMessage}
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-2 text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Profil Bilgileri */}
            <div className="mb-6 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Profil Bilgileri
              </h2>
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    E-posta
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    E-posta adresi değiştirilemez
                  </p>
                </div>

                {/* Username */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Kullanıcı Adı
                  </label>
                  {editingUsername ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Kullanıcı adı"
                        maxLength={50}
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        disabled={saving}
                      />
                      <button
                        onClick={handleUpdateUsername}
                        disabled={saving || !newUsername.trim()}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                      <button
                        onClick={() => {
                          setNewUsername(username);
                          setEditingUsername(false);
                        }}
                        disabled={saving}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      >
                        İptal
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={username}
                        disabled
                        className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      />
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      >
                        Düzenle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bitbucket Bağlantısı */}
            <div className="mb-6 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Bitbucket Bağlantısı
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Bitbucket hesabınızı bağlayın.
              </p>
              {bitbucketConnected ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 transition-all dark:border-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <svg
                      className="h-5 w-5 text-green-600 dark:text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {bitbucketUsername ? `Bitbucket Bağlı (@${bitbucketUsername})` : "Bitbucket Bağlı"}
                  </button>
                  <button
                    onClick={handleDisconnectBitbucket}
                    className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Bağlantıyı Kopar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectBitbucket}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H20.71a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891L.778 1.213zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z" />
                  </svg>
                  Bitbucket Bağla
                </button>
              )}
            </div>

            {/* Çıkış Yap */}
            <div className="rounded-2xl border border-red-200/70 bg-red-50/50 p-6 shadow-sm dark:border-red-800/70 dark:bg-red-900/10">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Hesap İşlemleri
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Hesabınızdan çıkış yapmak için aşağıdaki butona tıklayın.
              </p>
              <button
                onClick={handleSignOut}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

