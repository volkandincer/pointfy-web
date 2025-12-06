"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Pin, BarChart3, LayoutGrid, X, Search, ChevronRight } from "lucide-react";
import FilterDropdown from "@/components/jira/FilterDropdown";
import FilterChip from "@/components/jira/FilterChip";
import EmptyState from "@/components/jira/EmptyState";
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
      } catch (err) {
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch boards");
      }

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

  const getBoardTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "scrum":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "kanban":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Board&apos;lar
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Tüm Jira board&apos;larınızı görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={fetchBoards}
          disabled={loading}
          className="rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Board ara (isim, proje)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 sm:text-base"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
            <div className="ml-auto flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  viewMode === "list"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-md px-3 py-1.5 text-sm transition ${
                  viewMode === "grid"
                    ? "bg-purple-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(typeFilter !== "all" || searchQuery.trim()) && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border-2 border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
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
                className="ml-auto flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
        <div className="rounded-md border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
              className={`h-32 animate-pulse border-l-4 border-l-blue-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-blue-500 dark:border-gray-700 dark:bg-gray-900 ${
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
                className="group relative border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: board.type === 'scrum' ? '#9333ea' : '#2563eb',
                }}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const IconComponent = getBoardTypeIcon(board.type);
                      return (
                        <div className="flex h-12 w-12 items-center justify-center border-2 bg-purple-50 dark:bg-purple-900/20" style={{ borderColor: board.type === 'scrum' ? '#9333ea' : '#2563eb' }}>
                          <IconComponent className="h-6 w-6" style={{ color: board.type === 'scrum' ? '#9333ea' : '#2563eb' }} />
                        </div>
                      );
                    })()}
                    <span
                      className={`border-2 px-2.5 py-1 text-xs font-semibold ${getBoardTypeColor(
                        board.type
                      )}`}
                      style={{
                        borderColor: board.type === 'scrum' ? '#9333ea' : '#2563eb',
                      }}
                    >
                      {board.type}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 opacity-0 transition-all group-hover:opacity-100" />
                </div>
                <h3 className="relative mb-3 text-lg font-bold text-gray-900 dark:text-white">
                  {board.name}
                </h3>
                <div className="relative space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-semibold">Proje:</span>{" "}
                    <span className="font-mono font-semibold text-green-600 dark:text-green-400"
                      {board.location?.projectKey}
                    </span>
                  </div>
                  {board.location?.displayName && (
                    <div>
                      <span className="font-semibold">Görünen İsim:</span>{" "}
                      <span className="font-medium">{board.location.displayName}</span>
                    </div>
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
                className="group relative block border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: board.type === 'scrum' ? '#9333ea' : '#2563eb',
                }}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      {(() => {
                        const IconComponent = getBoardTypeIcon(board.type);
                        return (
                          <div className="flex h-12 w-12 items-center justify-center border-2 bg-purple-50 dark:bg-purple-900/20" style={{ borderColor: board.type === 'scrum' ? '#9333ea' : '#2563eb' }}>
                            <IconComponent className="h-6 w-6" style={{ color: board.type === 'scrum' ? '#9333ea' : '#2563eb' }} />
                          </div>
                        );
                      })()}
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                        {board.name}
                      </h3>
                      <span
                        className={`border-2 px-2.5 py-1 text-xs font-semibold ${getBoardTypeColor(
                          board.type
                        )}`}
                        style={{
                          borderColor: board.type === 'scrum' ? '#9333ea' : '#2563eb',
                        }}
                      >
                        {board.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <span className="font-semibold">Proje:</span>{" "}
                        <span className="font-mono font-semibold text-green-600 dark:text-green-400"
                          {board.location?.projectKey}
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
                  <ChevronRight className="h-6 w-6 shrink-0 text-purple-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
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
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {filteredBoards.length} board gösteriliyor
          {searchQuery && boards.length !== filteredBoards.length && (
            <span> (toplam {boards.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

