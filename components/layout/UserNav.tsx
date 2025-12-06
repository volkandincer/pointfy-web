"use client";

import { memo, useEffect, useState } from "react";
import { User, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";

const UserNav = memo(function UserNav() {
  const router = useRouter();
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
        className="min-h-[44px] rounded-lg border-2 border-blue-600 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all active:border-blue-700 active:bg-blue-700 active:shadow-md hover:border-blue-700 hover:bg-blue-700 hover:shadow-md"
      >
        Giriş Yap
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/app/account"
        className="group flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-gray-200/80 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all active:border-blue-300 active:bg-blue-50 active:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:active:border-blue-500 dark:active:bg-blue-900/20 dark:active:text-blue-400 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-blue-600 text-white">
          <User className="h-4 w-4" />
        </div>
        <span className="hidden sm:inline">Hesabım</span>
      </Link>
      <button
        onClick={async () => {
          try {
            const supabase = getSupabase();
            await supabase.auth.signOut();
            setIsAuthed(false);
            router.replace("/login");
            router.refresh();
          } catch {
            router.replace("/login");
          }
        }}
        className="group relative flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-red-200/70 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all active:border-red-300 active:bg-red-50 active:text-red-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-500/40 dark:bg-gray-800 dark:text-gray-300 dark:active:border-red-500 dark:active:bg-red-900/20 dark:active:text-red-400 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-red-600 bg-red-600 text-white">
          <LogOut className="h-4 w-4" />
        </div>
        <span className="hidden sm:inline">Çıkış Yap</span>
      </button>
    </div>
  );
});

export default UserNav;
