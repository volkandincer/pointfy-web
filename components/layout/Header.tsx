"use client";

import Link from "next/link";
import { memo, useState, useEffect } from "react";
import { Layers, X, Menu, Home, Zap, ClipboardList, FileText, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import UserNav from "./UserNav";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

// Navigation item icon mapping
const getNavIcon = (href: string) => {
  if (href === "/" || href.startsWith("/app/rooms")) return Home;
  if (href.startsWith("/app/jira")) return Zap;
  if (href.startsWith("/app/boards")) return ClipboardList;
  if (href.startsWith("/app/tasks")) return ClipboardList;
  if (href.startsWith("/app/notes")) return FileText;
  if (href.startsWith("/app/account")) return Settings;
  return null;
};

const Header = memo(function Header({ navigationItems }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Mobile menu açıkken body scroll'unu disable et
  useEffect(() => {
    if (mobileMenuOpen) {
      // Scroll pozisyonunu kaydet
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else {
      // Scroll pozisyonunu geri yükle
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }

    return () => {
      // Cleanup
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-bold transition-all"
          onClick={closeMobileMenu}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md border-2 border-blue-600 bg-blue-600 shadow-sm transition-all group-hover:border-blue-700 group-hover:bg-blue-700 group-hover:shadow-md">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 dark:text-white">
            Pointfy
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            const IconComponent = getNavIcon(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex min-h-[44px] items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                {IconComponent && (
                  <IconComponent className="h-4 w-4" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="ml-2 border-l-2 border-gray-200 pl-2 dark:border-gray-700">
            <UserNav />
          </div>
        </nav>

        {/* Mobile Navigation - Right Side */}
        <div className="flex items-center gap-2 md:hidden">
          <UserNav />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border-2 border-gray-300 bg-white text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label={mobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 md:hidden"
            onClick={closeMobileMenu}
            onTouchStart={(e) => {
              e.preventDefault();
              closeMobileMenu();
            }}
          />
          {/* Menu Content */}
          <div className="absolute left-0 right-0 z-50 border-t-2 border-gray-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900 md:hidden">
            <nav className="container mx-auto px-4 py-3">
              <div className="flex flex-col gap-1">
                {navigationItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href));
                  const IconComponent = getNavIcon(item.href);
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobileMenu}
                      onTouchStart={(e) => {
                        // Touch event'i sayfa scroll'undan ayır
                        e.stopPropagation();
                      }}
                      className={`flex min-h-[48px] items-center gap-3 rounded-md px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                        isActive
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                      }`}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                    >
                      {IconComponent && (
                        <IconComponent className="h-5 w-5 shrink-0" />
                      )}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
});

export default Header;
