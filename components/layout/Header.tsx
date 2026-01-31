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
      <header className="w-full border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto relative flex h-16 items-center justify-between px-4">
        {/* Brand Name - Left */}
        <Link
          href="/"
          className="group flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm text-white">
              P
            </div>
            <span className="text-xl font-bold text-white">
              Pointfy
            </span>
          </div>
          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
            BETA
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfa</span>
          </Link>

          <Link
            href="/app/jira"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/jira")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Jira</span>
          </Link>

          <Link
            href="/app/rooms"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/rooms")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            <span>Odalar</span>
          </Link>

          <Link
            href="/app/boards"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/boards")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Board&apos;lar</span>
          </Link>

          <Link
            href="/app/tasks"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/tasks")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Task&apos;lar</span>
          </Link>

          <Link
            href="/app/notes"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive("/app/notes")
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Notlar</span>
          </Link>
        </nav>

        {/* Mobile Right Side - Theme & User */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            aria-label={theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          {isAuthed ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <User className="w-5 h-5" />
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
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>

        {/* Desktop Right Side - Theme & User */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            aria-label={theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User Menu */}
          {isAuthed ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
              >
                <User className="w-5 h-5" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-slate-700 bg-slate-800 shadow-lg">
                  <div className="p-1">
                    <Link
                      href="/app/account"
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        isActive("/app/account")
                          ? "bg-blue-600 text-white"
                          : "text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span>Hesabım</span>
                    </Link>
                    <div className="my-1 border-t border-slate-700" />
                    <Link
                      href="/about"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      <Info className="h-4 w-4" />
                      <span>Hakkında</span>
                    </Link>
                    <Link
                      href="/contact"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex min-h-[36px] items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
                    >
                      <Mail className="h-4 w-4" />
                      <span>İletişim</span>
                    </Link>
                    <div className="my-1 border-t border-slate-700" />
                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="flex min-h-[36px] w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
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
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors text-slate-300 hover:text-white"
            >
              <User className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>

    </header>
    </div>
  );
});

export default Header;
