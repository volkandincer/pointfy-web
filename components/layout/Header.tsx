"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState, useEffect, useRef } from "react";
import {
  X,
  Menu,
  Home,
  Zap,
  ClipboardList,
  FileText,
  CheckSquare,
  Sparkles,
  Info,
  Mail,
  ChevronDown,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/utils/scrollLock";
import { useTheme } from "@/hooks/useTheme";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

const Header = memo(function Header({ navigationItems }: HeaderProps) {
  // navigationItems prop is kept for interface compatibility but not currently used
  void navigationItems;
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Mobile menu açıkken body scroll'unu disable et
  useEffect(() => {
    if (mobileMenuOpen) {
      lockBodyScroll();
    } else {
      unlockBodyScroll();
    }

    return () => {
      // Cleanup - sadece menu açıkken cleanup yap
      if (mobileMenuOpen) {
        unlockBodyScroll();
      }
    };
  }, [mobileMenuOpen]);

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

  // More menu dışına tıklanınca kapat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(event.target as Node)
      ) {
        setMoreMenuOpen(false);
      }
    };

    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [moreMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setIsAuthed(false);
      router.replace("/login");
      router.refresh();
    } catch {
      router.replace("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-border/60 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-1 text-xl font-bold transition-all hover:opacity-80"
          onClick={closeMobileMenu}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
            <Image
              src="/logo.png"
              alt="TeamHubX Logo"
              width={40}
              height={40}
              className="h-full w-full object-contain"
              priority
              unoptimized
            />
          </div>
          <span className="font-bold text-foreground">TeamHubX</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-2 md:flex">
          {/* Ana Sayfa */}
          <Link
            href="/"
            className={`group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
              pathname === "/"
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
            }`}
          >
            <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Ana Sayfa</span>
          </Link>

          {/* Jira */}
          <Link
            href="/app/jira"
            className={`group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
              pathname?.startsWith("/app/jira")
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
            }`}
          >
            <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Jira</span>
          </Link>

          {/* Board'lar */}
          <Link
            href="/app/boards"
            className={`group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
              pathname?.startsWith("/app/boards")
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
            }`}
          >
            <ClipboardList className="h-4 w-4 transition-transform group-hover:scale-110" />
            <span>Board&apos;lar</span>
          </Link>

          {/* More Dropdown */}
          <div className="relative" ref={moreMenuRef}>
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`group relative flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 ${
                moreMenuOpen ||
                pathname?.startsWith("/app/tasks") ||
                pathname?.startsWith("/app/notes") ||
                pathname === "/features" ||
                pathname === "/about" ||
                pathname === "/contact"
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-accent/80 hover:text-accent-foreground"
              }`}
            >
              <span>Daha Fazla</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  moreMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {moreMenuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border-2 border-border/60 bg-popover/95 backdrop-blur-md shadow-xl">
                <div className="py-1">
                  <Link
                    href="/app/tasks"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                      pathname?.startsWith("/app/tasks")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <CheckSquare className="h-4 w-4" />
                    <span>Task&apos;larım</span>
                  </Link>
                  <Link
                    href="/app/notes"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                      pathname?.startsWith("/app/notes")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <FileText className="h-4 w-4" />
                    <span>Notlarım</span>
                  </Link>
                  <div className="my-1 border-t-2 border-border" />
                  <Link
                    href="/features"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                      pathname === "/features"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Özellikler</span>
                  </Link>
                  <Link
                    href="/about"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                      pathname === "/about"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Info className="h-4 w-4" />
                    <span>Hakkında</span>
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMoreMenuOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                      pathname === "/contact"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    <span>İletişim</span>
                  </Link>

                  {/* Theme Switcher */}
                  <div className="my-1 border-t-2 border-border" />
                  <div className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-2">
                    <div className="flex items-center gap-3">
                      {theme === "dark" ? (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm font-semibold text-muted-foreground">
                        {theme === "dark" ? "Dark Mode" : "Light Mode"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMoreMenuOpen(false);
                        toggleTheme();
                      }}
                      className={`relative flex h-6 w-11 items-center rounded-full border-2 border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                        theme === "dark" ? "bg-primary" : "bg-muted"
                      }`}
                      aria-label={
                        theme === "dark"
                          ? "Light mode'a geç"
                          : "Dark mode'a geç"
                      }
                    >
                      <span
                        className={`block h-4 w-4 rounded-full bg-background transition-transform ${
                          theme === "dark" ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>

                  {isAuthed && (
                    <>
                      <div className="my-1 border-t-2 border-border" />
                      <Link
                        href="/app/account"
                        onClick={() => setMoreMenuOpen(false)}
                        className={`flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold transition-all ${
                          pathname?.startsWith("/app/account")
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`}
                      >
                        <User className="h-4 w-4" />
                        <span>Hesabım</span>
                      </Link>
                      <button
                        onClick={() => {
                          setMoreMenuOpen(false);
                          handleSignOut();
                        }}
                        className="flex min-h-[44px] w-full items-center gap-3 px-4 py-2 text-left text-sm font-semibold text-red-600 transition-all hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Çıkış Yap</span>
                      </button>
                    </>
                  )}
                  {!isAuthed && (
                    <>
                      <div className="my-1 border-t-2 border-border" />
                      <Link
                        href="/login"
                        onClick={() => setMoreMenuOpen(false)}
                        className="flex min-h-[44px] items-center gap-3 px-4 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10 hover:text-primary"
                      >
                        <User className="h-4 w-4" />
                        <span>Giriş Yap</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile Navigation - Right Side */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border-2 border-border/60 bg-card/80 backdrop-blur-sm text-foreground transition-all duration-200 hover:border-primary/50 hover:bg-accent/80 active:bg-accent"
            aria-label={mobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 transition-transform" />
            ) : (
              <Menu className="h-6 w-6 transition-transform" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={closeMobileMenu}
            onTouchStart={(e) => {
              e.preventDefault();
              closeMobileMenu();
            }}
          />
          {/* Menu Content */}
          <div className="absolute left-0 right-0 z-50 border-t-2 border-border/60 bg-background/95 backdrop-blur-md shadow-xl md:hidden">
            <nav className="container mx-auto px-4 py-3">
              <div className="flex flex-col gap-1">
                {/* Ana Sayfa */}
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-accent ${
                    pathname === "/"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Home className="h-5 w-5 shrink-0" />
                  <span>Ana Sayfa</span>
                </Link>

                {/* Jira */}
                <Link
                  href="/app/jira"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname?.startsWith("/app/jira")
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Zap className="h-5 w-5 shrink-0" />
                  <span>Jira</span>
                </Link>

                {/* Board'lar */}
                <Link
                  href="/app/boards"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname?.startsWith("/app/boards")
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <ClipboardList className="h-5 w-5 shrink-0" />
                  <span>Board&apos;lar</span>
                </Link>

                {/* Task'lar */}
                <Link
                  href="/app/tasks"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname?.startsWith("/app/tasks")
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <CheckSquare className="h-5 w-5 shrink-0" />
                  <span>Task&apos;larım</span>
                </Link>

                {/* Notlar */}
                <Link
                  href="/app/notes"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname?.startsWith("/app/notes")
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <FileText className="h-5 w-5 shrink-0" />
                  <span>Notlarım</span>
                </Link>

                <div className="my-1 border-t-2 border-gray-200 dark:border-gray-700" />

                {/* Özellikler */}
                <Link
                  href="/features"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname === "/features"
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Sparkles className="h-5 w-5 shrink-0" />
                  <span>Özellikler</span>
                </Link>

                {/* Hakkında */}
                <Link
                  href="/about"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname === "/about"
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Info className="h-5 w-5 shrink-0" />
                  <span>Hakkında</span>
                </Link>

                {/* İletişim */}
                <Link
                  href="/contact"
                  onClick={closeMobileMenu}
                  onTouchStart={(e) => e.stopPropagation()}
                  className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                    pathname === "/contact"
                      ? "bg-primary/10 text-primary"
                      : "text-card-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <Mail className="h-5 w-5 shrink-0" />
                  <span>İletişim</span>
                </Link>

                {isAuthed && (
                  <>
                    <div className="my-1 border-t-2 border-border" />
                    {/* Hesabım */}
                    <Link
                      href="/app/account"
                      onClick={closeMobileMenu}
                      onTouchStart={(e) => e.stopPropagation()}
                      className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                        pathname?.startsWith("/app/account")
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <User className="h-5 w-5 shrink-0" />
                      <span>Hesabım</span>
                    </Link>
                    {/* Çıkış Yap */}
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        handleSignOut();
                      }}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-left text-base font-semibold text-destructive transition-all active:bg-destructive/10"
                    >
                      <LogOut className="h-5 w-5 shrink-0" />
                      <span>Çıkış Yap</span>
                    </button>
                  </>
                )}

                {!isAuthed && (
                  <>
                    <div className="my-1 border-t-2 border-border" />
                    {/* Giriş Yap */}
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold text-primary transition-all active:bg-primary/10"
                    >
                      <User className="h-5 w-5 shrink-0" />
                      <span>Giriş Yap</span>
                    </Link>
                  </>
                )}

                {/* Theme Switcher - Mobile */}
                <div className="my-1 border-t-2 border-border" />
                <div className="flex min-h-[48px] items-center justify-between gap-3 rounded-md border-2 border-border bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    {theme === "dark" ? (
                      <Moon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Sun className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className="text-base font-semibold text-foreground">
                      {theme === "dark" ? "Dark Mode" : "Light Mode"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      closeMobileMenu();
                      toggleTheme();
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                    className={`relative flex h-7 w-12 items-center rounded-full border-2 border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                      theme === "dark" ? "bg-primary" : "bg-muted"
                    }`}
                    aria-label={
                      theme === "dark" ? "Light mode'a geç" : "Dark mode'a geç"
                    }
                  >
                    <span
                      className={`block h-5 w-5 rounded-full bg-background transition-transform ${
                        theme === "dark" ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
});

export default Header;
