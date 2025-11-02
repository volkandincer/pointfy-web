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
            router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
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
            router.replace(`${redirectTo}?returnUrl=${returnUrl}`);
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
        (_event, session) => {
          if (!isMounted) return;
          const authed = Boolean(session);
          setIsAuthed(authed);
          setChecked(true);
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

  if (!checked) {
    return null;
  }
  if (!isAuthed) {
    return null;
  }
  return children as unknown as React.ReactElement;
}
