"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Folder,
  ClipboardList,
  Pin,
  Search,
  Settings,
  Link2,
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getSupabase } from "@/lib/supabase";
import { getAccessToken } from "@/lib/authFetch";

interface JiraLayoutProps {
  children: React.ReactNode;
}

interface JiraNavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const jiraNavItems: JiraNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/app/jira", icon: LayoutDashboard },
  { id: "projects", label: "Projeler", href: "/app/jira/projects", icon: Folder },
  { id: "issues", label: "Issue'larım", href: "/app/jira/issues", icon: ClipboardList },
  { id: "boards", label: "Board'lar", href: "/app/jira/boards", icon: Pin },
  { id: "search", label: "Arama", href: "/app/jira/search", icon: Search },
  { id: "settings", label: "Ayarlar", href: "/app/jira/settings", icon: Settings },
];

export default function JiraLayout({ children }: JiraLayoutProps) {
  const pathname = usePathname();
  const navigationItems: NavigationItem[] = getDefaultNavigationItems();
  const [jiraConnected, setJiraConnected] = useState<boolean | null>(null); // null = henüz kontrol edilmedi

  useEffect(() => {
    let mounted = true;
    async function checkJiraConnection() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) {
          // User yoksa jiraConnected false olarak set et
          if (mounted) {
            setJiraConnected(false);
          }
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_access_token")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          // jiraConnected'ı set et - null'dan false veya true'ya geçer
          setJiraConnected(!!userRow?.jira_access_token);
        }
      } catch {
        if (mounted) {
          // Hata durumunda jiraConnected false olarak set et
          setJiraConnected(false);
        }
      }
    }

    checkJiraConnection();

    return () => {
      mounted = false;
    };
  }, []);

  // Bağlantı kontrolü tamamlanana kadar skeleton göster
  // jiraConnected null ise henüz kontrol edilmedi demektir
  if (jiraConnected === null) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-6">
              {/* Sidebar Skeleton */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-6">
                  <div className="rounded-md border-2 border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-10 w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
              {/* Content Skeleton */}
              <main className="flex-1">
                <div className="space-y-6">
                  <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse border-2 border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900"
                      />
                    ))}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </div>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  // Bağlantı kontrolü tamamlandı ve bağlı değilse "Jira gerekli" ekranını göster
  // jiraConnected false ise bağlı değil demektir (null değil, yani kontrol tamamlandı)
  if (jiraConnected === false) {
    return (
      <>
        <Header navigationItems={navigationItems} />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-md border-2 border-purple-600 bg-white p-6 shadow-sm sm:p-8 dark:border-purple-500 dark:bg-gray-900">
                <div className="mb-6 text-center">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-purple-600 bg-purple-600 text-white shadow-sm">
                      <Link2 className="h-12 w-12" />
                    </div>
                  </div>
                  <h2 className="mb-2 text-base font-bold text-gray-900 dark:text-white">
                    Jira Bağlantısı Gerekli
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Jira projelerinizi ve issue&apos;larınızı görüntülemek için Jira hesabınızı bağlamanız gerekiyor.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const accessToken = await getAccessToken();
                      if (!accessToken) return;

                      const returnUrl = encodeURIComponent(pathname || "/app/jira");
                      window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&accessToken=${encodeURIComponent(accessToken)}`;
                    } catch {
                      // Jira OAuth error
                    }
                  }}
                  className="w-full rounded-md border-2 border-purple-600 bg-purple-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition-all hover:border-purple-700 hover:bg-purple-700 hover:shadow-md"
                >
                  Jira&apos;yı Bağla
                </button>
              </div>
            </div>
          </div>
        </div>
        <Footer navigationItems={navigationItems} />
      </>
    );
  }

  // Bağlıysa sidebar navigation ile göster
  const isActive = (href: string) => {
    if (href === "/app/jira") {
      return pathname === "/app/jira";
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <Header navigationItems={navigationItems} />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-6 lg:flex-row">
            {/* Sidebar Navigation */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-6">
                <div className="rounded-md border-2 border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-4">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                      Jira Modülü
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tüm Jira işlemleriniz
                    </p>
                  </div>
                  <nav className="space-y-1">
                    {jiraNavItems.map((item) => {
                      const active = isActive(item.href);
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                        >
                          <IconComponent className="h-5 w-5 shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="w-full flex-1 lg:w-auto">
              {/* Tab Navigation - Header'ın Altında, Mobilde Sticky */}
              <div className="sticky top-0 z-40 -mx-4 mb-6 border-b border-gray-200 bg-white/95 backdrop-blur-sm px-4 pb-0 shadow-sm dark:border-gray-800 dark:bg-gray-950/95 lg:static lg:mx-0 lg:border-b lg:bg-transparent lg:shadow-none lg:backdrop-blur-0">
                <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide pb-0 lg:gap-1">
                  {jiraNavItems.map((item) => {
                    const active = isActive(item.href);
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`group relative flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-all duration-200 sm:px-4 sm:py-3 ${
                          active
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                      >
                        <IconComponent
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ${
                            active ? "scale-110 text-purple-600 dark:text-purple-400" : "group-hover:scale-105"
                          }`}
                        />
                        <span className="whitespace-nowrap">{item.label}</span>
                        {/* Active Indicator - Underline */}
                        {active && (
                          <span className="absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 rounded-full bg-purple-600 dark:bg-purple-400" />
                        )}
                        {/* Hover Indicator */}
                        {!active && (
                          <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-purple-600 transition-all duration-200 group-hover:w-1/2 dark:bg-purple-400" />
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Page Content */}
              <div>{children}</div>
            </main>
          </div>
        </div>
      </div>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

