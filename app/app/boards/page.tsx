"use client";

import { useMemo, useState } from "react";
import { ClipboardList, Archive } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BoardList from "@/components/boards/BoardList";
import SectionHeader from "@/components/ui/SectionHeader";
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
        <main className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-12">
            <div className="mx-auto max-w-7xl">
              {/* Header Section */}
              <div className="mb-8">
                <SectionHeader
                  title="Board'larım"
                  description="Task'larınızı ve notlarınızı organize edin, projelerinizi yönetin"
                />

                {/* Stats Cards */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Total Boards */}
                  <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 blur-xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-transparent transition-transform group-hover:scale-110">
                        <ClipboardList className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-card-foreground">{stats.totalBoards}</div>
                        <div className="text-sm font-medium text-muted-foreground">Toplam Board</div>
                      </div>
                    </div>
                  </div>

                  {/* Active Boards */}
                  <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-green-600 dark:border-l-green-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 blur-xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-transparent transition-transform group-hover:scale-110">
                        <ClipboardList className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-card-foreground">{stats.activeBoards}</div>
                        <div className="text-sm font-medium text-muted-foreground">Aktif Board</div>
                      </div>
                    </div>
                  </div>

                  {/* Archived Boards */}
                  <div className="group relative overflow-hidden rounded-lg border-l-4 border-l-muted-foreground border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5">
                    <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-muted-foreground/10 to-muted-foreground/5 blur-xl transition-all group-hover:scale-150" />
                    <div className="relative mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-muted-foreground/20 to-transparent transition-transform group-hover:scale-110">
                        <Archive className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-card-foreground">{stats.archivedBoards}</div>
                        <div className="text-sm font-medium text-muted-foreground">Arşivlenmiş</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tab Buttons */}
                <div className="inline-flex rounded-lg border-2 border-border bg-card p-1 shadow-sm">
                  <button
                    onClick={() => setShowArchived(false)}
                    className={`px-6 py-2.5 text-sm font-semibold transition-all duration-200 rounded-md ${
                      !showArchived
                        ? "border-2 border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-2 border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Aktif Board&apos;lar
                  </button>
                  <button
                    onClick={() => setShowArchived(true)}
                    className={`px-6 py-2.5 text-sm font-semibold transition-all duration-200 rounded-md ${
                      showArchived
                        ? "border-2 border-primary bg-primary text-primary-foreground shadow-sm"
                        : "border-2 border-transparent text-muted-foreground hover:text-foreground"
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

