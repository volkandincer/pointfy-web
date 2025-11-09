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
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md">
          <div className="mb-6 flex gap-4">
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                isLogin
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              }`}
              onClick={() => setIsLogin(true)}
            >
              Giriş
            </button>
            <button
              className={`rounded-md px-3 py-2 text-sm font-semibold ${
                !isLogin
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "border border-gray-300 text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
              }`}
              onClick={() => setIsLogin(false)}
            >
              Kayıt
            </button>
          </div>
          <h1 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
            {isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </h1>
          <form
            onSubmit={isLogin ? handleLogin : handleSignup}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                E-posta
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Şifre
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {!isLogin && (
              <div>
                <label
                  htmlFor="username"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Kullanıcı Adı
                </label>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 shadow-sm outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
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
              <p className="text-sm text-red-600 dark:text-red-400">
                {message}
              </p>
            )}
          </form>
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
