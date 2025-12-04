"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { RequireAuthProps } from "@/interfaces/Auth.interface";

export default function RequireAuth({
  children,
  redirectTo = "/login",
}: RequireAuthProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState<boolean>(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    async function check() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const authed = Boolean(data.session);
        setIsAuthed(authed);
        setChecked(true);
        // Only redirect if not authenticated and not already on login page
        if (!authed && pathname && !pathname.startsWith("/login")) {
          // Use window.location.pathname if available (client-side), otherwise use pathname
          const currentPath =
            typeof window !== "undefined"
              ? window.location.pathname
              : pathname || "/";
          // Only set returnUrl if it's not login page and not already a login URL
          if (
            currentPath !== "/login" &&
            !currentPath.startsWith("/login") &&
            !currentPath.includes("returnUrl")
          ) {
            const returnUrl = encodeURIComponent(currentPath);
            setIsRedirecting(true);
            // router.replace async olabilir, setTimeout ile state'i güncelle
            setTimeout(() => {
              router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
            }, 0);
          } else {
            // Don't redirect if already going to login
            return;
          }
        }
      } catch {
        if (!isMounted) return;
        setIsAuthed(false);
        setChecked(true);
        // Only redirect if not already on login page
        if (pathname && !pathname.startsWith("/login")) {
          const currentPath =
            typeof window !== "undefined"
              ? window.location.pathname
              : pathname || "/";
          if (
            currentPath !== "/login" &&
            !currentPath.startsWith("/login") &&
            !currentPath.includes("returnUrl")
          ) {
            const returnUrl = encodeURIComponent(currentPath);
            setIsRedirecting(true);
            // router.replace async olabilir, setTimeout ile state'i güncelle
            setTimeout(() => {
              router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
            }, 0);
          } else {
            // Don't redirect if already going to login
            return;
          }
        }
      }
    }

    // Initial check
    check();

    // Listen for auth state changes (especially after login)
    try {
      const supabase = getSupabase();
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (!isMounted) return;
          const authed = Boolean(session);
          setIsAuthed(authed);
          setChecked(true);

          // Login sonrası otomatik redirect yap
          if (
            event === "SIGNED_IN" &&
            authed &&
            pathname?.startsWith("/login")
          ) {
            // Login sayfasındayken login olduysa returnUrl'e yönlendir
            const urlParams = new URLSearchParams(window.location.search);
            const returnUrl = urlParams.get("returnUrl");
            const targetUrl = returnUrl ? decodeURIComponent(returnUrl) : "/";
            // Login sayfasından çık
            if (targetUrl !== "/login" && targetUrl.startsWith("/")) {
              router.replace(targetUrl);
            }
          }
        }
      );
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch {
      // ignore
    }

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [redirectTo, router, pathname]);

  // Loading state - show loading UI instead of white screen
  if (!checked || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {isRedirecting ? "Yönlendiriliyor..." : "Yükleniyor..."}
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated - show loading while redirecting
  if (!isAuthed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent dark:border-blue-400" />
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Giriş sayfasına yönlendiriliyor...
          </p>
        </div>
      </div>
    );
  }

  return children as unknown as React.ReactElement;
}
