"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import { getSupabase } from "@/lib/supabase";

interface JiraLayoutProps {
  children: React.ReactNode;
}

interface JiraNavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
}

const jiraNavItems: JiraNavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/app/jira", icon: "📊" },
  { id: "projects", label: "Projeler", href: "/app/jira/projects", icon: "📁" },
  { id: "issues", label: "Issue'larım", href: "/app/jira/issues", icon: "📋" },
  { id: "boards", label: "Board'lar", href: "/app/jira/boards", icon: "📌" },
  { id: "search", label: "Arama", href: "/app/jira/search", icon: "🔍" },
  { id: "settings", label: "Ayarlar", href: "/app/jira/settings", icon: "⚙️" },
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
      } catch (err) {
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-6">
            <div className="flex gap-6">
              {/* Sidebar Skeleton */}
              <aside className="hidden w-64 shrink-0 lg:block">
                <div className="sticky top-6">
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="h-10 w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </aside>
              {/* Content Skeleton */}
              <main className="flex-1">
                <div className="space-y-6">
                  <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-blue-200/70 bg-white p-8 shadow-lg dark:border-blue-800/70 dark:bg-gray-900">
                <div className="mb-6 text-center">
                  <div className="mb-4 text-6xl">🔗</div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                    Jira Bağlantısı Gerekli
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Jira projelerinizi ve issue&apos;larınızı görüntülemek için Jira hesabınızı bağlamanız gerekiyor.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const supabase = getSupabase();
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData.user) return;

                      const returnUrl = encodeURIComponent(pathname || "/app/jira");
                      const encodedUserId = encodeURIComponent(userData.user.id);
                      window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                    } catch (err) {
                      // Jira OAuth error
                    }
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-6">
          <div className="flex gap-6">
            {/* Sidebar Navigation */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-6">
                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <div className="mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                      Jira Modülü
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tüm Jira işlemleriniz
                    </p>
                  </div>
                  <nav className="space-y-1">
                    {jiraNavItems.map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                              : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </aside>

            {/* Mobile Navigation */}
            <div className="mb-4 w-full lg:hidden">
              <div className="overflow-x-auto">
                <div className="flex gap-2">
                  {jiraNavItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                          active
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                            : "bg-white text-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main className="flex-1">{children}</main>
          </div>
        </div>
      </div>
      <Footer navigationItems={navigationItems} />
    </>
  );
}

