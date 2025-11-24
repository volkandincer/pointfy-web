"use client";

import { memo, useEffect, useState } from "react";
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
        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-md"
      >
        Giriş Yap
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/app/account"
        className="group flex items-center gap-2 rounded-lg border border-gray-200/80 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-500 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M19 20C19 17.2386 15.866 15 12 15C8.13401 15 5 17.2386 5 20"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
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
        className="group relative flex items-center gap-2 rounded-lg border border-red-200/70 bg-white px-3 py-2 text-sm font-semibold text-gray-600 shadow-sm transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-red-500/40 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-red-500 via-red-500 to-pink-500 text-white shadow-sm transition-all group-hover:shadow-md">
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13 6L13 4C13 3.44772 12.5523 3 12 3L5 3C4.44772 3 4 3.44772 4 4L4 20C4 20.5523 4.44772 21 5 21L12 21C12.5523 21 13 20.5523 13 20L13 18"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17 16L20 12L17 8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 12L20 12"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="hidden sm:inline">Çıkış Yap</span>
      </button>
    </div>
  );
});

export default UserNav;
