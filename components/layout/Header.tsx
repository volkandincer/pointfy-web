"use client";

import Link from "next/link";
import { memo, useState, useEffect, useRef, useCallback } from "react";
import { Home, Zap, ClipboardList, FileText, CheckSquare, Info, Mail, ChevronDown, User, LogOut, Sun, Moon, DoorOpen } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useTheme } from "@/hooks/useTheme";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import BetaBanner from "./BetaBanner";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

const Header = memo(function Header({ navigationItems }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auth state kontrolü
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

  // User menu dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);


  const handleSignOut = useCallback(async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setIsAuthed(false);
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const isActive = useCallback((path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  }, [pathname]);

  return (
    <div className="sticky top-0 z-50">
      <BetaBanner />
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto relative flex h-14 items-center justify-between px-4 md:px-6">
        {/* Brand Name - Left */}
        <Link
          href="/"
          className="group flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-sm font-bold tracking-tight text-transparent transition-all group-hover:from-primary group-hover:via-primary/90 group-hover:to-primary/70 md:text-base">
            TeamHubX
          </span>
          <span className="relative rounded-full border border-yellow-500/60 bg-gradient-to-br from-yellow-50 to-yellow-100/80 px-2 py-0.5 text-[10px] font-bold leading-none tracking-wider text-yellow-700 shadow-sm backdrop-blur-sm transition-all group-hover:border-yellow-500/80 group-hover:shadow-md dark:border-yellow-500/40 dark:from-yellow-900/20 dark:to-yellow-900/10 dark:text-yellow-400 dark:group-hover:border-yellow-500/60">
            BETA
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
          <Link
            href="/"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Home className="h-4 w-4" />
            <span>Ana Sayfa</span>
          </Link>

          <Link
            href="/app/jira"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/app/jira")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <Zap className="h-4 w-4" />
            <span>Jira</span>
          </Link>

          <Link
            href="/app/rooms"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/app/rooms")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <DoorOpen className="h-4 w-4" />
            <span>Odalar</span>
          </Link>

          <Link
            href="/app/boards"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/app/boards")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4" />
            <span>Board&apos;lar</span>
          </Link>

          <Link
            href="/app/tasks"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/app/tasks")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <CheckSquare className="h-4 w-4" />
            <span>Task&apos;lar</span>
          </Link>

          <Link
            href="/app/notes"
            className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive("/app/notes")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Notlar</span>
          </Link>
        </nav>

        {/* Mobile Right Side - Theme & User */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent"
            aria-label={theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Menu */}
          {isAuthed ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent"
              >
                <User className="h-4 w-4" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-popover shadow-md">
                  <div className="p-1">
                    <Link
                      href="/app/account"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive("/app/account")
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Hesabım</span>
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <Link
                      href="/about"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Info className="h-4 w-4" />
                      <span>Hakkında</span>
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Mail className="h-4 w-4" />
                      <span>İletişim</span>
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-primary bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <User className="h-4 w-4" />
            </Link>
          )}
        </div>

        {/* Desktop Right Side - Theme & User */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-md border border-border bg-card text-foreground transition-colors hover:bg-accent"
            aria-label={theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* User Menu */}
          {isAuthed ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex min-h-[36px] items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <User className="h-4 w-4" />
                <ChevronDown className={`h-3 w-3 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-border bg-popover shadow-md">
                  <div className="p-1">
                    <Link
                      href="/app/account"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive("/app/account")
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Hesabım</span>
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <Link
                      href="/about"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Info className="h-4 w-4" />
                      <span>Hakkında</span>
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <Mail className="h-4 w-4" />
                      <span>İletişim</span>
                    </Link>
                    <div className="my-1 border-t border-border" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex min-h-[36px] items-center gap-2 rounded-md border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <User className="h-4 w-4" />
              <span>Giriş Yap</span>
            </Link>
          )}
        </div>
      </div>

    </header>
    </div>
  );
});

export default Header;
