"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";

function LoginPageContent() {
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnUrl = searchParams.get("returnUrl") || "/";
  // Clean returnUrl - remove any nested login URLs to prevent loops
  const returnUrl = (() => {
    try {
      let decoded = decodeURIComponent(rawReturnUrl);
      // Keep extracting nested returnUrl until we get a clean path
      let maxIterations = 5; // Prevent infinite loops
      while (
        decoded.includes("/login") &&
        decoded.includes("returnUrl=") &&
        maxIterations > 0
      ) {
        try {
          const url = new URL(decoded, "http://localhost");
          const nestedReturnUrl = url.searchParams.get("returnUrl");
          if (nestedReturnUrl && nestedReturnUrl !== decoded) {
            decoded = decodeURIComponent(nestedReturnUrl);
            maxIterations--;
          } else {
            break;
          }
        } catch {
          // If URL parsing fails, try regex fallback
          const match = decoded.match(/returnUrl=([^&]+)/);
          if (match && match[1] !== decoded) {
            decoded = decodeURIComponent(match[1]);
            maxIterations--;
          } else {
            break;
          }
        }
      }
      // Final check: if still contains login, use home page
      if (decoded.includes("/login")) {
        return "/";
      }
      return decoded.startsWith("/") ? decoded : "/";
    } catch {
      return "/";
    }
  })();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    // Redirect immediately if already logged in
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        setCheckingAuth(false);
        if (data.user) {
          // Use the cleaned returnUrl directly (already decoded)
          const targetUrl =
            returnUrl && returnUrl !== "/login" && returnUrl.startsWith("/")
              ? returnUrl
              : "/";
          setTimeout(() => {
            router.replace(targetUrl);
          }, 300);
        }
      } catch {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    })();
    // Also listen for auth state changes to catch fresh logins
    try {
      const supabase = getSupabase();
      const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
        if (session?.user && mounted) {
          // Wait longer to ensure RequireAuth has detected the session
          setTimeout(() => {
            if (mounted) {
              // Use the cleaned returnUrl directly (already decoded)
              const targetUrl =
                returnUrl && returnUrl !== "/login" && returnUrl.startsWith("/")
                  ? returnUrl
                  : "/";
              router.replace(targetUrl);
            }
          }, 300);
        }
      });
      return () => {
        mounted = false;
        sub.subscription.unsubscribe();
      };
    } catch {
      return () => {
        mounted = false;
        setCheckingAuth(false);
      };
    }
  }, [router, returnUrl]);

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-white dark:bg-gray-950" />
          <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Kontrol ediliyor...
              </p>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error || !data.user) throw error || new Error("Giriş başarısız.");
      // Wait for session to be fully persisted and RequireAuth to detect it
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Use the cleaned returnUrl directly (already decoded)
      const targetUrl =
        returnUrl && returnUrl !== "/login" && returnUrl.startsWith("/")
          ? returnUrl
          : "/";
      router.replace(targetUrl);
    } catch (err: unknown) {
      setMessage((err as Error).message || "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const supabase = getSupabase();
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: { data: { username: username.trim() } },
        });
      if (signUpError) throw signUpError;
      const newUser = signUpData.user;
      if (!newUser) throw new Error("Kayıt sonrası kullanıcı bulunamadı.");
      
      // Trigger (handle_new_user) otomatik olarak public.users tablosuna insert yapıyor
      // Ama username'i doğru set etmek için, eğer row yoksa insert, varsa update yap
      // ON CONFLICT kullanarak duplicate key hatasını önle
      const { error: userInsertError } = await supabase
        .from("users")
        .upsert({
          id: newUser.id,
          username: username.trim() || email.split("@")[0],
          email: email.trim(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: "id",
        });
      
      if (userInsertError) {
        // User insert/update error
        // Hata olsa bile devam et, trigger zaten insert yapmış olabilir
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (signInError) throw signInError;
      // Wait for session to be fully persisted and RequireAuth to detect it
      await new Promise((resolve) => setTimeout(resolve, 300));
      // Use the cleaned returnUrl directly (already decoded)
      const targetUrl =
        returnUrl && returnUrl !== "/login" && returnUrl.startsWith("/")
          ? returnUrl
          : "/";
      router.replace(targetUrl);
    } catch (err: unknown) {
      setMessage((err as Error).message || "Kayıt başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-blue-50 via-white to-white dark:from-gray-950/40 dark:via-gray-950 dark:to-gray-950" />
        <div className="pointer-events-none absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/20" />
        <div className="pointer-events-none absolute -right-40 -bottom-40 h-80 w-80 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/20" />

        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {/* Card */}
            <div className="rounded-2xl border border-gray-200/70 bg-white/80 p-8 shadow-xl backdrop-blur-md dark:border-gray-800/70 dark:bg-gray-900/80">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 p-2 shadow-xl shadow-blue-500/30">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                  <svg
                    className="relative h-full w-full text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2L2 7L12 12L22 7L12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M2 17L12 22L22 17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                    <path
                      d="M2 12L12 17L22 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      fill="none"
                    />
                  </svg>
                </div>
              </div>

              {/* Tab buttons */}
              <div className="mb-8 flex gap-2 border border-gray-300 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
                <button
                  className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                    isLogin
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                >
                  Giriş Yap
                </button>
                <button
                  className={`flex-1 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                    !isLogin
                      ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                  onClick={() => {
                    setIsLogin(false);
                    setMessage("");
                  }}
                >
                  Kayıt Ol
                </button>
              </div>

              {/* Title */}
              <h1 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white">
                {isLogin ? "Hesabınıza Giriş Yapın" : "Yeni Hesap Oluşturun"}
              </h1>

              {/* Form */}
              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Şifre
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                {!isLogin && (
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Kullanıcı Adı
                    </label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full border border-gray-300 bg-white px-4 py-2.5 text-gray-900 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
                      placeholder="kullaniciadi"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full border-2 border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 hover:border-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? isLogin
                      ? "Giriş yapılıyor..."
                      : "Kayıt olunuyor..."
                    : isLogin
                    ? "Giriş Yap"
                    : "Kayıt Ol"}
                </button>
                {message && (
                  <div className="border border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
                    {message}
                  </div>
                )}
              </form>

            </div>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <>
        <Header navigationItems={getDefaultNavigationItems()} />
        <main className="container mx-auto px-4 py-16">
          <div className="h-40 animate-pulse border border-gray-300 bg-gray-100 dark:border-gray-700 dark:bg-gray-800" />
        </main>
        <Footer navigationItems={getDefaultNavigationItems()} />
      </>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
