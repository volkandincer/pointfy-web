"use client";

import { Suspense, useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getDefaultNavigationItems } from "@/lib/utils";
import { getSupabase } from "@/lib/supabase";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

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
          <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />
          <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm font-medium text-muted-foreground">
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
      setMessage(formatErrorMessage(err));
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
      setMessage(formatErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header navigationItems={navigationItems} />
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-background" />

        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {/* Card */}
             <div className="rounded-md border-2 border-border bg-card p-8 shadow-md">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-primary bg-primary/10">
                  <Layers className="h-8 w-8 text-primary" />
                </div>
              </div>

              {/* Tab buttons */}
              <div className="mb-8 flex gap-2 rounded-md border-2 border-border bg-muted p-1">
                <button
                  className={`flex-1 border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isLogin
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent text-muted-foreground hover:text-card-foreground"
                  }`}
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                >
                  Giriş Yap
                </button>
                <button
                  className={`flex-1 border-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    !isLogin
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent text-muted-foreground hover:text-card-foreground"
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
              <h1 className="mb-8 text-center text-2xl font-bold text-card-foreground">
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
                    className="mb-2 block text-sm font-medium text-card-foreground"
                  >
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="ornek@email.com"
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-card-foreground"
                  >
                    Şifre
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                  />
                </div>
                {!isLogin && (
                  <div>
                    <label
                      htmlFor="username"
                      className="mb-2 block text-sm font-medium text-card-foreground"
                    >
                      Kullanıcı Adı
                    </label>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full rounded-md border-2 border-input bg-input px-4 py-2.5 text-card-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="kullaniciadi"
                    />
                  </div>
                )}
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={loading}
                >
                  {loading
                    ? isLogin
                      ? "Giriş yapılıyor..."
                      : "Kayıt olunuyor..."
                    : isLogin
                    ? "Giriş Yap"
                    : "Kayıt Ol"}
                </Button>
                {message && (
                  <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
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
          <div className="h-40 animate-pulse border border-border bg-muted" />
        </main>
        <Footer navigationItems={getDefaultNavigationItems()} />
      </>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
