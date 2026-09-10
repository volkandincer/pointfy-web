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
        className="min-h-[44px] rounded-md border-2 border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:border-primary hover:bg-primary/90 hover:shadow-md active:bg-primary/80"
      >
        Giriş Yap
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/app/account"
        className="group flex min-h-[44px] items-center gap-2 rounded-md border-2 border-border bg-card px-3 py-2 text-sm font-semibold text-card-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-primary/5 hover:text-primary active:bg-primary/10"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
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
        className="group relative flex min-h-[44px] items-center gap-2 rounded-md border-2 border-destructive/30 bg-card px-3 py-2 text-sm font-semibold text-card-foreground shadow-sm transition-all hover:border-destructive/60 hover:bg-destructive/10 hover:text-destructive active:bg-destructive/15"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-destructive text-destructive-foreground">
          <LogOut className="h-4 w-4" />
        </div>
        <span className="hidden sm:inline">Çıkış Yap</span>
      </button>
    </div>
  );
});

export default UserNav;
