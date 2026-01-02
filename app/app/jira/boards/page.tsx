"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pin, BarChart3, LayoutGrid, X, Search, ChevronRight } from "lucide-react";
import FilterDropdown from "@/components/jira/FilterDropdown";
import FilterChip from "@/components/jira/FilterChip";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import type { JiraBoard } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

export default function JiraBoardsPage() {
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");

  // Boards state
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [filteredBoards, setFilteredBoards] = useState<JiraBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Jira base URL'i al
  useEffect(() => {
    let mounted = true;
    async function getJiraBaseUrl() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted && userRow?.jira_base_url) {
          setJiraBaseUrl(userRow.jira_base_url);
        }
      } catch {
        // Jira base URL fetch error
      }
    }

    getJiraBaseUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // Boards fetch
  const fetchBoards = useCallback(async () => {
    if (!jiraBaseUrl) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/boards?${urlParams.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch boards";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse failed, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setBoards(data.boards || []);
      setFilteredBoards(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards");
    } finally {
      setLoading(false);
    }
  }, [jiraBaseUrl]);

  useEffect(() => {
    if (jiraBaseUrl) {
      fetchBoards();
    }
  }, [jiraBaseUrl, fetchBoards]);

  // Extract unique board types with counts
  const typeOptions = useMemo(() => {
    const typeMap = new Map<string, number>();
    boards.forEach((board) => {
      typeMap.set(board.type, (typeMap.get(board.type) || 0) + 1);
    });
    return Array.from(typeMap.entries())
      .map(([value, count]) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [boards]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setTypeFilter("all");
    setSearchQuery("");
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = [...boards];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (board) =>
          board.name.toLowerCase().includes(query) ||
          board.location?.projectKey?.toLowerCase().includes(query) ||
          board.location?.projectName?.toLowerCase().includes(query) ||
          board.location?.displayName?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((board) => board.type === typeFilter);
    }

    setFilteredBoards(filtered);
  }, [searchQuery, typeFilter, boards]);

  const getBoardTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "scrum":
        return BarChart3;
      case "kanban":
        return LayoutGrid;
      default:
        return Pin;
    }
  };


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <SectionHeader
        title="Board'lar"
        description="Tüm Jira board'larınızı görüntüleyin ve yönetin"
        action={
          <button
            onClick={fetchBoards}
            disabled={loading}
            className="rounded-lg border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
        }
      />

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Board ara (isim, proje)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 pl-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <FilterDropdown
              label="Tip"
              value={typeFilter}
              options={[
                { value: "all", label: "Tüm Tipler" },
                ...typeOptions,
              ]}
              onChange={setTypeFilter}
              className="min-w-[160px]"
            />

            {/* View Mode Toggle */}
            <div className="ml-auto flex items-center gap-2 rounded-lg border-2 border-border bg-card p-1">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
                  viewMode === "list"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(typeFilter !== "all" || searchQuery.trim()) && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-border bg-muted/50 p-3">
              <span className="text-xs font-semibold text-muted-foreground">
                Aktif Filtreler:
              </span>
              {typeFilter !== "all" && (
                <FilterChip
                  label={`Tip: ${typeOptions.find((t) => t.value === typeFilter)?.label || typeFilter}`}
                  value={typeFilter}
                  onRemove={() => setTypeFilter("all")}
                  color="purple"
                />
              )}
              {searchQuery.trim() && (
                <FilterChip
                  label={`Arama: "${searchQuery}"`}
                  value="search"
                  onRemove={() => setSearchQuery("")}
                  color="orange"
                />
              )}
              <button
                onClick={clearAllFilters}
                className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <X className="h-3 w-3" />
                Tümünü Temizle
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Boards Content */}
      {loading && boards.length === 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
              : "space-y-3 sm:space-y-4"
          }
        >
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-32 animate-pulse border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4 ${
                viewMode === "list" ? "w-full" : ""
              }`}
            />
          ))}
        </div>
      ) : filteredBoards.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {filteredBoards.map((board) => (
              <Link
                key={board.id}
                href={`/app/jira/${board.location?.projectKey || board.id}`}
                className="group relative block overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-4"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
                <div className="relative mb-4 flex items-start justify-between">
                  {(() => {
                    const IconComponent = getBoardTypeIcon(board.type);
                    return (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110 sm:h-14 sm:w-14">
                        <IconComponent className="h-6 w-6 text-purple-600 dark:text-purple-400 sm:h-8 sm:w-8" />
                      </div>
                    );
                  })()}
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="relative mb-2 text-lg font-semibold text-card-foreground">
                  {board.name}
                </h3>
                <div className="relative space-y-1 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium">Proje:</span>{" "}
                    <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                      {board.location?.projectKey || "N/A"}
                    </span>
                  </p>
                  {board.location?.displayName && (
                    <p>
                      <span className="font-medium">Görünen İsim:</span>{" "}
                      <span className="font-medium">{board.location.displayName}</span>
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredBoards.map((board) => (
              <Link
                key={board.id}
                href={`/app/jira/${board.location?.projectKey || board.id}`}
                className="group relative block overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-border hover:shadow-xl sm:p-4"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {(() => {
                      const IconComponent = getBoardTypeIcon(board.type);
                      return (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110">
                          <IconComponent className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      );
                    })()}
                    <div>
                      <h3 className="relative mb-1 text-lg font-semibold text-card-foreground">
                        {board.name}
                      </h3>
                      <div className="relative flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <span className="font-semibold">Proje:</span>{" "}
                          <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
                            {board.location?.projectKey || "N/A"}
                          </span>
                        </span>
                        {board.location?.displayName && (
                          <span>
                            <span className="font-semibold">Görünen İsim:</span>{" "}
                            <span className="font-medium">{board.location.displayName}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={searchQuery || typeFilter !== "all" ? Search : Pin}
          title={
            searchQuery || typeFilter !== "all"
              ? "Board bulunamadı"
              : "Henüz board yok"
          }
          description={
            searchQuery || typeFilter !== "all"
              ? "Arama kriterlerinize uygun board bulunamadı. Filtreleri temizleyip tekrar deneyin."
              : "Jira hesabınızda henüz board bulunmuyor. Board'lar oluşturulduğunda burada görünecektir."
          }
          actionLabel={
            searchQuery || typeFilter !== "all"
              ? "Filtreleri Temizle"
              : undefined
          }
          onAction={
            searchQuery || typeFilter !== "all"
              ? clearAllFilters
              : undefined
          }
        />
      )}

      {/* Results Count */}
      {filteredBoards.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {filteredBoards.length} board gösteriliyor
          {searchQuery && boards.length !== filteredBoards.length && (
            <span> (toplam {boards.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

