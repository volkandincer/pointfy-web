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
  const [email, setEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUsername, setEditingUsername] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

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

        const { data: userRow } = await supabase
          .from("users")
          .select("username")
          .eq("key", userData.user.id)
          .single();

        if (!mounted) return;

        if (userRow?.username) {
          setUsername(userRow.username);
          setNewUsername(userRow.username);
        } else {
          const emailUsername = userData.user.email?.split("@")[0] || "User";
          setUsername(emailUsername);
          setNewUsername(emailUsername);
        }
      } catch (err) {
        console.error("Account fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchUserData();
    return () => {
      mounted = false;
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
        .eq("key", userKey)
        .maybeSingle();

      if (existingUser) {
        // Güncelle
        const { error } = await supabase
          .from("users")
          .update({ username: newUsername.trim() })
          .eq("key", userKey);

        if (error) throw error;
      } else {
        // Yeni kayıt oluştur
        const { error } = await supabase.from("users").insert({
          key: userKey,
          username: newUsername.trim(),
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

