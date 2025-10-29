"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import type { RequireAuthProps } from "@/interfaces/Auth.interface";

export default function RequireAuth({
  children,
  redirectTo = "/login",
}: RequireAuthProps) {
  const router = useRouter();
  const [checked, setChecked] = useState<boolean>(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        const authed = Boolean(data.session);
        setIsAuthed(authed);
        setChecked(true);
        if (!authed) router.replace(redirectTo);
      } catch {
        if (!isMounted) return;
        setIsAuthed(false);
        setChecked(true);
        router.replace(redirectTo);
      }
    }
    check();
  }, [redirectTo, router]);

  if (!checked) {
    return null;
  }
  if (!isAuthed) {
    return null;
  }
  return children as unknown as React.ReactElement;
}
