"use client";

import { useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BoardList from "@/components/boards/BoardList";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function BoardsPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [showArchived, setShowArchived] = useState<boolean>(false);

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    Board&apos;larım
                  </h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    Task&apos;larınızı ve notlarınızı organize edin, projelerinizi yönetin
                  </p>
                </div>

                {/* Tab Buttons */}
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                      !showArchived
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Aktif Board&apos;lar
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                      showArchived
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Arşivlenmiş
                  </button>
                </div>
              </div>

              <BoardList showArchived={showArchived} />
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

