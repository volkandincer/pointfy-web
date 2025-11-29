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
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);

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
          if (
            userRowError.code === "PGRST116" ||
            userRowError.message?.includes("0 rows")
          ) {
            const emailUsername = userData.user.email?.split("@")[0] || "User";
            // Trigger (handle_new_user) otomatik olarak public.users tablosuna insert yapıyor
            // Ama eğer row yoksa, upsert kullanarak güvenli bir şekilde oluştur
            const { error: insertError } = await supabase.from("users").upsert(
              {
                id: userData.user.id,
                username: emailUsername,
                email: userData.user.email || "",
                created_at: new Date().toISOString(),
              },
              {
                onConflict: "id",
              }
            );

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

        // Jira bağlantı durumu
        try {
          const { data: jiraRow } = await supabase
            .from("users")
            .select("jira_access_token")
            .eq("id", userData.user.id)
            .maybeSingle();

          if (jiraRow?.jira_access_token) {
            setJiraConnected(true);
          } else {
            setJiraConnected(false);
          }
        } catch (jiraError) {
          console.error("❌ Jira kontrol hatası:", jiraError);
          setJiraConnected(false);
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
      if (error) {
        setErrorMessage(decodeURIComponent(error));
        // URL'den error parametresini temizle
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }

      // Jira bağlantısı başarılı olduysa, veriyi yeniden çek
      const jiraConnected = urlParams.get("jira_connected");
      if (jiraConnected === "true") {
        console.log(
          "🔄 Jira bağlantısı başarılı, veri yeniden çekiliyor..."
        );
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
        const { error } = await supabase.from("users").upsert(
          {
            id: userKey,
            username: newUsername.trim(),
            email: email, // Ensure email is also inserted
            created_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

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

  const handleConnectJira = async () => {
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
    window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
  };

  const handleDisconnectJira = async () => {
    if (
      !confirm(
        "Jira hesabınızı bağlantıdan koparmak istediğinize emin misiniz?"
      )
    ) {
      return;
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from("users")
        .update({
          jira_access_token: null,
          jira_refresh_token: null,
          jira_token_expires_at: null,
        })
        .eq("id", userKey);

      if (error) throw error;

      setJiraConnected(false);
      alert("Jira hesabı bağlantıdan koparıldı.");
    } catch (err) {
      console.error("Jira disconnect error:", err);
      alert("Jira bağlantısı koparılamadı.");
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

            {/* Jira Bağlantısı */}
            <div className="mb-6 rounded-2xl border border-gray-200/70 bg-white p-6 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
              <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                Jira Bağlantısı
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Jira hesabınızı bağlayın.
              </p>
              {jiraConnected ? (
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
                    Jira Bağlı
                  </button>
                  <button
                    onClick={handleDisconnectJira}
                    className="w-full rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    Bağlantıyı Kopar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectJira}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                  </svg>
                  Jira Bağla
                </button>
              )}
            </div>

            {/* Çıkış Yap */}
            <div className="rounded-2xl border border-red-200/70 bg-red-50/50 p-6 shadow-sm dark:border-red-800/70 dark:bg-red-900/10">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Hesap İşlemleri
              </h2>

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
