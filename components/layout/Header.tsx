"use client";

import Link from "next/link";
import { memo } from "react";
import { usePathname } from "next/navigation";
import UserNav from "./UserNav";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

interface HeaderProps {
  navigationItems: NavigationItem[];
}

const Header = memo(function Header({ navigationItems }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/70 bg-white/95 backdrop-blur-md shadow-sm dark:border-gray-800/70 dark:bg-gray-900/95">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-xl font-bold transition-transform hover:scale-105"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 p-1.5 shadow-lg shadow-blue-500/30 transition-all group-hover:shadow-xl group-hover:shadow-blue-500/40">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
            <svg
              className="relative h-full w-full text-white"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent dark:from-white dark:via-gray-100 dark:to-white">
            Pointfy
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
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
          <div className="ml-2 border-l border-gray-200 pl-2 dark:border-gray-700">
            <UserNav />
          </div>
        </nav>
      </div>
    </header>
  );
});

export default Header;
