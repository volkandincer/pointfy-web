"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Archive } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BoardList from "@/components/boards/BoardList";
import { getDefaultNavigationItems } from "@/lib/utils";
import { useBoards } from "@/hooks/useBoards";
import type { NavigationItem } from "@/interfaces/Navigation.interface";

export default function BoardsPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const { boards } = useBoards();

  const stats = useMemo(() => {
    const activeBoards = boards.filter((b) => !b.is_archived).length;
    const archivedBoards = boards.filter((b) => b.is_archived).length;
    const totalBoards = boards.length;
    return { activeBoards, archivedBoards, totalBoards };
  }, [boards]);

  return (
    <>
      <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    Board&apos;larım
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Task&apos;larınızı ve notlarınızı organize edin, projelerinizi yönetin
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20">
                        <ClipboardList className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBoards}</div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Board</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20">
                        <ClipboardList className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeBoards}</div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Board</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border-2 border-gray-300 bg-white p-4 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-600 bg-gray-50 dark:bg-gray-800">
                        <Archive className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.archivedBoards}</div>
                        <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Arşivlenmiş</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Buttons */}
                <div className="inline-flex rounded-md border-2 border-gray-300 bg-white p-1 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                      !showArchived
                        ? "border-2 border-green-600 bg-green-600 text-white"
                        : "border-2 border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Aktif Board&apos;lar
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`px-6 py-2.5 text-sm font-semibold transition-colors ${
                      showArchived
                        ? "border-2 border-green-600 bg-green-600 text-white"
                        : "border-2 border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
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
  );
}

