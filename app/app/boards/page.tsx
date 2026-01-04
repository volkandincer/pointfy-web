"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Archive } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
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
          <div className="container mx-auto px-4 py-8">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-6">
                <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <PageHeader
                    title="Board'larım"
                    description="Task'larınızı ve notlarınızı organize edin, projelerinizi yönetin"
                    icon={ClipboardList}
                    iconColor="green"
                  />
                  
                  {/* Stats - Inline Badge Style */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 rounded-full border border-green-600/30 bg-green-50 px-3 py-1.5 dark:bg-green-900/20 dark:border-green-700/30">
                      <ClipboardList className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {stats.totalBoards} Toplam
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full border border-green-600/30 bg-green-50 px-3 py-1.5 dark:bg-green-900/20 dark:border-green-700/30">
                      <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                        {stats.activeBoards} Aktif
                      </span>
                    </div>
                    {stats.archivedBoards > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-gray-50 px-3 py-1.5 dark:bg-gray-800 dark:border-gray-700">
                        <Archive className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-400">
                          {stats.archivedBoards}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tab Buttons - Underline Style */}
                <div className="flex items-center gap-6 border-b border-gray-300 dark:border-gray-700">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`relative pb-2 text-xs font-semibold transition-colors ${
                      !showArchived
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Aktif Board&apos;lar
                    {!showArchived && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 dark:bg-green-400" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`relative pb-2 text-xs font-semibold transition-colors ${
                      showArchived
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                  >
                    Arşivlenmiş
                    {showArchived && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 dark:bg-green-400" />
                    )}
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

