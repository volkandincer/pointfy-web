"use client";

import Link from "next/link";
import { memo, useCallback } from "react";
import { Home, Zap, ClipboardList, CheckSquare, FileText, User } from "lucide-react";
import { usePathname } from "next/navigation";

const BottomNavigation = memo(function BottomNavigation() {
  const pathname = usePathname();

  const isActive = useCallback(
    (path: string) => {
      if (path === "/") return pathname === "/";
      return pathname?.startsWith(path);
    },
    [pathname]
  );

  const navItems = [
    {
      href: "/",
      label: "Ana Sayfa",
      icon: Home,
    },
    {
      href: "/app/jira",
      label: "Jira",
      icon: Zap,
    },
    {
      href: "/app/boards",
      label: "Board'lar",
      icon: ClipboardList,
    },
    {
      href: "/app/tasks",
      label: "Task'lar",
      icon: CheckSquare,
    },
    {
      href: "/app/notes",
      label: "Notlar",
      icon: FileText,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
      <div className="container mx-auto flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1 transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

export default BottomNavigation;

