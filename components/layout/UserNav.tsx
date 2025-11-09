"use client";

import { memo, useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";

const UserNav = memo(function UserNav() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;
        setIsAuthed(Boolean(data.session));
      } catch {
        if (!isMounted) return;
        setIsAuthed(false);
      }
    }
    check();
    let unsubscribe: (() => void) | undefined;
    try {
      const supabase = getSupabase();
      const { data: listener } = supabase.auth.onAuthStateChange(
        (_e, session) => {
          setIsAuthed(Boolean(session));
        }
      );
      unsubscribe = () => listener.subscription.unsubscribe();
    } catch {
      unsubscribe = undefined;
    }
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!isAuthed) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        Giriş Yap
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/app/account"
        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
      >
        Hesabım
      </Link>
      <button
        onClick={async () => {
          try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
          } catch {
            // ignore
          }
        }}
        className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
      >
        Çıkış Yap
      </button>
    </div>
  );
});

export default UserNav;
