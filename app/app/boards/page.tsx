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
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6">
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                Board&apos;larım
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Task&apos;larınızı ve notlarınızı organize edin
              </p>
            </div>

            <div className="mb-4 flex gap-2">
              <button
                onClick={() => setShowArchived(false)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  !showArchived
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Aktif Board&apos;lar
              </button>
              <button
                onClick={() => setShowArchived(true)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  showArchived
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                Arşivlenmiş Board&apos;lar
              </button>
            </div>

            <BoardList showArchived={showArchived} />
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}

