"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

  // Extract unique board types
  const uniqueTypes = useMemo(() => {
    const types = new Set(boards.map((board) => board.type));
    return Array.from(types).sort();
  }, [boards]);

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
        return "📊";
      case "kanban":
        return "📋";
      default:
        return "📌";
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
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 sm:text-base"
          />
          <svg
            className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tüm Tipler</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="ml-auto flex items-center gap-2 rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
            <button
              onClick={() => setViewMode("list")}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
              className={`h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${
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
                className="group block rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getBoardTypeIcon(board.type)}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBoardTypeColor(
                        board.type
                      )}`}
                    >
                      {board.type}
                    </span>
                  </div>
                  <svg
                    className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                  {board.name}
                </h3>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Proje:</span>{" "}
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {board.location?.projectKey}
                    </span>
                  </div>
                  {board.location?.displayName && (
                    <div>
                      <span className="font-medium">Görünen İsim:</span>{" "}
                      {board.location.displayName}
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
                className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="text-xl">{getBoardTypeIcon(board.type)}</span>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                        {board.name}
                      </h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getBoardTypeColor(
                          board.type
                        )}`}
                      >
                        {board.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <span className="font-medium">Proje:</span>{" "}
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {board.location?.projectKey}
                        </span>
                      </span>
                      {board.location?.displayName && (
                        <span>
                          <span className="font-medium">Görünen İsim:</span>{" "}
                          {board.location.displayName}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-6xl">📌</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {searchQuery || typeFilter !== "all"
              ? "Board bulunamadı"
              : "Henüz board yok"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || typeFilter !== "all"
              ? "Arama kriterlerinize uygun board bulunamadı."
              : "Jira board'ları bulunmuyor."}
          </p>
        </div>
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

