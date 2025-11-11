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

  useEffect(() => {
    let mounted = true;
    // Redirect immediately if already logged in
    (async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
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
        // ignore
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
      };
    }
  }, [router, returnUrl]);

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
      await supabase.from("users").insert({
        key: newUser.id,
        username: username.trim() || email.split("@")[0],
        created_at: new Date().toISOString(),
      });
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
              <div className="mb-8 flex gap-2 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
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
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
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
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
                      placeholder="kullaniciadi"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-purple-700 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
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
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {message}
                  </div>
                )}
              </form>

              {/* Divider */}
              <div className="my-6 flex items-center">
                <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
                <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                  veya
                </span>
                <div className="flex-1 border-t border-gray-300 dark:border-gray-700" />
              </div>

              {/* OAuth buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google ile {isLogin ? "Giriş Yap" : "Kayıt Ol"} - Yakında
                </button>

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub ile {isLogin ? "Giriş Yap" : "Kayıt Ol"} - Yakında
                </button>

                <button
                  type="button"
                  disabled
                  className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-400 opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.778 1.213a.768.768 0 00-.768.892l3.263 19.81c.084.5.515.868 1.022.873H20.71a.772.772 0 00.77-.646l3.27-20.03a.768.768 0 00-.768-.891L.778 1.213zM14.52 15.53H9.522L8.17 8.466h7.561l-1.211 7.064z" />
                  </svg>
                  Bitbucket ile {isLogin ? "Giriş Yap" : "Kayıt Ol"} - Yakında
                </button>
              </div>
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
          <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
        </main>
        <Footer navigationItems={getDefaultNavigationItems()} />
      </>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
