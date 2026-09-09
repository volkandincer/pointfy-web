"use client";

import { Suspense, useEffect, useState } from "react";
import { Layers } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
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
  const [isLogin, setIsLogin] = useState<boolean>(
    searchParams.get("tab") !== "register"
  );
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
          <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
      <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-muted/30">
        <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            {/* Card */}
             <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="h-7 w-7" />
                </div>
              </div>

              {/* Tab buttons */}
              <div className="mb-8 flex gap-1 rounded-lg border border-border bg-muted p-1">
                <Button
                  variant={isLogin ? "primary" : "ghost"}
                  size="md"
                  fullWidth
                  className={`flex-1 ${isLogin ? "" : "border-transparent"}`}
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                >
                  Giriş Yap
                </Button>
                <Button
                  variant={!isLogin ? "primary" : "ghost"}
                  size="md"
                  fullWidth
                  className={`flex-1 ${!isLogin ? "" : "border-transparent"}`}
                  onClick={() => {
                    setIsLogin(false);
                    setMessage("");
                  }}
                >
                  Kayıt Ol
                </Button>
              </div>

              {/* Title */}
              <h1 className="mb-8 text-center text-lg font-bold text-card-foreground">
                {isLogin ? "Hesabınıza Giriş Yapın" : "Yeni Hesap Oluşturun"}
              </h1>

              {/* Form */}
              <form
                onSubmit={isLogin ? handleLogin : handleSignup}
                className="space-y-5"
              >
                <Input
                  id="email"
                  type="email"
                  label="E-posta"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  size="md"
                />
                <Input
                  id="password"
                  type="password"
                  label="Şifre"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  size="md"
                />
                {!isLogin && (
                  <Input
                    id="username"
                    type="text"
                    label="Kullanıcı Adı"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="kullaniciadi"
                    size="md"
                  />
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
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
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
          <div className="h-40 animate-pulse rounded-xl border border-border bg-muted" />
        </main>
        <Footer navigationItems={getDefaultNavigationItems()} />
      </>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
