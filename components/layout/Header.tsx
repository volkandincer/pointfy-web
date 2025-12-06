"use client";

import Link from "next/link";
import { memo, useState } from "react";
import { Layers, X, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import UserNav from "./UserNav";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

const Header = memo(function Header({ navigationItems }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b-2 border-gray-200/70 bg-white/95 backdrop-blur-md shadow-sm dark:border-gray-800/70 dark:bg-gray-900/95">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-bold transition-all"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-blue-600 bg-blue-600 shadow-sm transition-all group-hover:border-blue-700 group-hover:bg-blue-700 group-hover:shadow-md">
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
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                }`}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="ml-2 border-l-2 border-gray-200 pl-2 dark:border-gray-700">
            <UserNav />
          </div>
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-2 md:hidden">
          <UserNav />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
            aria-label="Menu"
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
        <div className="border-t-2 border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <nav className="container mx-auto px-4 py-3">
            <div className="flex flex-col gap-1">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-[44px] rounded-lg px-4 py-3 text-base font-semibold transition-all active:bg-gray-200 dark:active:bg-gray-700 ${
                      isActive
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                    }`}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
});

export default Header;
