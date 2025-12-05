"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
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
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <div className="mb-6">
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    Board&apos;larım
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Task&apos;larınızı ve notlarınızı organize edin, projelerinizi yönetin
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-700/70">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 blur-2xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
                        <ClipboardList className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalBoards}</div>
                      <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Board</div>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-green-300/70 hover:shadow-xl dark:border-green-800/50 dark:from-green-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-green-700/70">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 blur-2xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-green-500/40">
                        <ClipboardList className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.activeBoards}</div>
                      <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Aktif Board</div>
                    </div>
                  </div>

                  <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-gray-300/70 hover:shadow-xl dark:border-gray-800/50 dark:from-gray-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-gray-700/70">
                    <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-600/20 blur-2xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-gray-500/40">
                        <Archive className="h-7 w-7" />
                      </div>
                    </div>
                    <div className="relative">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.archivedBoards}</div>
                      <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Arşivlenmiş</div>
                    </div>
                  </div>
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
  );
}

