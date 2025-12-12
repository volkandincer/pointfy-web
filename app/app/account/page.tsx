"use client";

import { useEffect, useMemo, useState } from "react";
import { X, CheckCircle2, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { useToastContext } from "@/contexts/ToastContext";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getSupabase } from "@/lib/supabase";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

export default function AccountPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const router = useRouter();
  const { showToast } = useToastContext();
  const [userKey, setUserKey] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUsername, setEditingUsername] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [showJiraPermissionModal, setShowJiraPermissionModal] = useState<boolean>(false);

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
          // User row fetch error
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
              // User insert/update error
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
          // Jira kontrol hatası
          setJiraConnected(false);
        }
      } catch (err) {
        // Account fetch error
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
        // Jira bağlantısı başarılı, veri yeniden çekiliyor
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
      showToast("Kullanıcı adı başarıyla güncellendi!", "success");
    } catch (err) {
      showToast(formatErrorMessage(err), "error");
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
      // Sign out error
    }
  };

  const handleConnectJira = () => {
    // Önce bilgilendirme modal'ını göster
    setShowJiraPermissionModal(true);
  };

  const handleConfirmJiraConnection = async () => {
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
        showToast("Kullanıcı bilgileri alınamadı. Lütfen sayfayı yenileyin.", "error");
        setShowJiraPermissionModal(false);
        return;
      }
    }

    if (!userId) {
      showToast("Kullanıcı bilgileri alınamadı. Lütfen sayfayı yenileyin.", "error");
      setShowJiraPermissionModal(false);
      return;
    }

    // Modal'ı kapat ve OAuth akışını başlat
    setShowJiraPermissionModal(false);
    const returnUrl = encodeURIComponent("/app/jira");
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
      showToast("Jira hesabı bağlantıdan koparıldı.", "success");
    } catch (err) {
      showToast(formatErrorMessage(err), "error");
    }
  };

  if (loading) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="h-40 animate-pulse border-2 border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  return (
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
              <div className="mb-6 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                Hata: {errorMessage}
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-2 text-red-800 hover:text-red-900 dark:text-red-300 dark:hover:text-red-200"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Profil Bilgileri */}
            <div className="mb-6 rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
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
                    className="w-full border-2 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
                        className="flex-1 rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-cyan-500"
                        disabled={saving}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleUpdateUsername}
                        disabled={saving || !newUsername.trim()}
                        loading={saving}
                        className="border-cyan-600 bg-cyan-600 hover:border-cyan-700 hover:bg-cyan-700 dark:border-cyan-500 dark:bg-cyan-600 dark:hover:bg-cyan-500"
                      >
                        {saving ? "Kaydediliyor..." : "Kaydet"}
                      </Button>
                      <button
                        onClick={() => {
                          setNewUsername(username);
                          setEditingUsername(false);
                        }}
                        disabled={saving}
                        className="rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
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
                        className="flex-1 border-2 border-gray-300 bg-gray-50 px-3 py-2 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                      />
                      <button
                        onClick={() => setEditingUsername(true)}
                        className="rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                      >
                        Düzenle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Jira Bağlantısı */}
            <div className="mb-6 rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
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
                    className="flex w-full items-center justify-center gap-3 border-2 border-green-600 bg-green-50 px-4 py-2.5 text-sm font-semibold text-green-700 dark:bg-green-900/20 dark:text-green-400"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Jira Bağlı
                  </button>
                  <button
                    onClick={handleDisconnectJira}
                    className="w-full rounded-md border-2 border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 hover:border-red-700 dark:bg-gray-800 dark:text-red-500 dark:hover:bg-red-900/20"
                  >
                    Bağlantıyı Kopar
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectJira}
                  className="flex w-full items-center justify-center gap-3 rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Link2 className="h-5 w-5" />
                  Jira Bağla
                </button>
              )}
            </div>

            {/* Çıkış Yap */}
            <div className="border-2 border-red-300 bg-red-50 p-6 shadow-sm dark:border-red-700 dark:bg-red-900/10">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Hesap İşlemleri
              </h2>

              <button
                onClick={handleSignOut}
                className="border-2 border-red-600 bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 hover:border-red-700"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />

        {/* Jira İzinleri Bilgilendirme Modal'ı */}
        <Modal
          open={showJiraPermissionModal}
          onClose={() => setShowJiraPermissionModal(false)}
          title="Jira Bağlantısı İçin Gerekli İzinler"
        >
          <div className="space-y-4">
            <div className="border-2 border-blue-300 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Neden bu izinler gerekli?</strong> Jira hesabınızı bağlamak için bu izinlere
                ihtiyacımız var. Bu sayede projelerinizi, issue&apos;larınızı ve board&apos;larınızı
                görüntüleyebilir, story point&apos;leri yönetebilirsiniz.
              </p>
            </div>

            <div className="space-y-3 border-2 border-gray-300 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-cyan-600 bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:border-cyan-500 dark:text-cyan-400">
                  <span className="text-xs font-semibold">1</span>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Jira Verilerini Okuma
                  </h4>
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Ne için:</strong> Projelerinizi, issue&apos;larınızı ve board&apos;larınızı
                    görüntüleyebilmek için
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Bu izin sayesinde Jira&apos;daki tüm projelerinizi ve size atanan görevleri
                    TeamHubX&apos;de görüntüleyebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-cyan-600 bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:border-cyan-500 dark:text-cyan-400">
                  <span className="text-xs font-semibold">2</span>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Jira Verilerini Güncelleme
                  </h4>
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Ne için:</strong> Poker planning sonuçlarını Jira&apos;daki issue&apos;lara
                    story point olarak kaydedebilmek için
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Takımınızla yaptığınız oylamaların sonuçlarını otomatik olarak Jira&apos;daki
                    ilgili issue&apos;lara aktarabiliriz.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-cyan-600 bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:border-cyan-500 dark:text-cyan-400">
                  <span className="text-xs font-semibold">3</span>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Board ve Sprint Erişimi
                  </h4>
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Ne için:</strong> Agile board&apos;larınızı ve sprint&apos;lerinizi
                    görüntüleyebilmek için
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Scrum ve Kanban board&apos;larınızı, aktif sprint&apos;lerinizi ve sprint
                    içindeki görevleri TeamHubX&apos;de görebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-green-600 bg-green-100 text-green-600 dark:bg-green-900/30 dark:border-green-500 dark:text-green-400">
                  <span className="text-xs font-semibold">✓</span>
                </div>
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                    Otomatik Yenileme
                  </h4>
                  <p className="mb-1 text-xs text-gray-600 dark:text-gray-400">
                    <strong>Ne için:</strong> Bağlantınızın sürekli aktif kalması için
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Her seferinde yeniden bağlanmanıza gerek kalmadan, bağlantınız otomatik olarak
                    yenilenir ve kesintisiz çalışır.
                </p>
                </div>
              </div>
            </div>

            <div className="border-2 border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
              <p className="text-xs text-green-800 dark:text-green-200">
                <strong>Güvenlik:</strong> Bu izinler sadece Jira verilerinize erişim sağlar. Hesap
                şifreniz, kişisel bilgileriniz veya diğer hassas verileriniz saklanmaz. İstediğiniz
                zaman hesap ayarlarından bağlantıyı kaldırabilirsiniz.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowJiraPermissionModal(false)}
                className="flex-1 rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                onClick={handleConfirmJiraConnection}
                className="flex-1 border-2 border-cyan-600 bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-700 hover:border-cyan-700 dark:border-cyan-500 dark:bg-cyan-600 dark:hover:bg-cyan-500"
              >
                Devam Et
              </button>
            </div>
          </div>
        </Modal>
    </>
  );
}
