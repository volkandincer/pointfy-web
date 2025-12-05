"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

export default function JiraIssuesPage() {
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");

  // Issues state
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
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

  // Issues fetch
  const fetchIssues = useCallback(async () => {
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
      urlParams.set("maxResults", "100");

      const response = await fetch(`/api/jira/issues?${urlParams.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch issues");
      }

      setIssues(data.issues || []);
      setFilteredIssues(data.issues || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setLoading(false);
    }
  }, [jiraBaseUrl]);

  useEffect(() => {
    if (jiraBaseUrl) {
      fetchIssues();
    }
  }, [jiraBaseUrl, fetchIssues]);

  // Extract unique values for filters
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(issues.map((issue) => issue.status));
    return Array.from(statuses).sort();
  }, [issues]);

  const uniquePriorities = useMemo(() => {
    const priorities = new Set(
      issues.map((issue) => issue.priority).filter(Boolean)
    );
    return Array.from(priorities).sort();
  }, [issues]);

  const uniqueProjects = useMemo(() => {
    const projects = new Set(issues.map((issue) => issue.project.key));
    return Array.from(projects).sort();
  }, [issues]);

  const uniqueTypes = useMemo(() => {
    const types = new Set(issues.map((issue) => issue.type));
    return Array.from(types).sort();
  }, [issues]);

  // Filter and search
  useEffect(() => {
    let filtered = [...issues];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.key.toLowerCase().includes(query) ||
          issue.summary.toLowerCase().includes(query) ||
          issue.project.name.toLowerCase().includes(query) ||
          issue.project.key.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((issue) => issue.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((issue) => issue.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((issue) => issue.project.key === projectFilter);
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((issue) => issue.type === typeFilter);
    }

    setFilteredIssues(filtered);
  }, [searchQuery, statusFilter, priorityFilter, projectFilter, typeFilter, issues]);

  const getStatusColor = (statusColor: string) => {
    switch (statusColor) {
      case "green":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "yellow":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "blue":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
    
    const lowerPriority = priority.toLowerCase();
    if (lowerPriority.includes("highest") || lowerPriority.includes("critical")) {
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    }
    if (lowerPriority.includes("high")) {
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    }
    if (lowerPriority.includes("medium")) {
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
    if (lowerPriority.includes("low")) {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Issue&apos;larım
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Size atanmış Jira issue&apos;larınızı görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={fetchIssues}
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
            placeholder="Issue ara (key, summary, project)..."
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
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tüm Durumlar</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tüm Öncelikler</option>
            {uniquePriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>

          {/* Project Filter */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tüm Projeler</option>
            {uniqueProjects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
          >
            <option value="all">Tüm Tipler</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
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

      {/* Issues Content */}
      {loading && issues.length === 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800 ${
                viewMode === "list" ? "w-full" : ""
              }`}
            />
          ))}
        </div>
      ) : filteredIssues.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {filteredIssues.map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border-2 border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(
                        issue.statusColor
                      )}`}
                    >
                      {issue.status}
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 line-clamp-2 text-base font-semibold text-gray-900 dark:text-white">
                  {issue.summary}
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Proje:</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {issue.project.key}
                    </span>
                  </div>
                  {issue.priority && (
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(issue.priority)}`}>
                        {issue.priority}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {issue.type}
                      </span>
                    </div>
                  )}
                  {issue.assignee && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Atanan:</span>
                      <span>{issue.assignee.name}</span>
                    </div>
                  )}
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredIssues.map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {issue.key}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColor(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                      {issue.priority && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getPriorityColor(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {issue.type}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                      {issue.summary}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <span className="font-medium">Proje:</span>{" "}
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {issue.project.key}
                        </span>
                      </span>
                      {issue.assignee && (
                        <span>
                          <span className="font-medium">Atanan:</span> {issue.assignee.name}
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
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 text-6xl">📋</div>
          <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? "Issue bulunamadı"
              : "Henüz issue yok"}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? "Arama kriterlerinize uygun issue bulunamadı."
              : "Size atanmış Jira issue'ları bulunmuyor."}
          </p>
        </div>
      )}

      {/* Results Count */}
      {filteredIssues.length > 0 && (
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {filteredIssues.length} issue gösteriliyor
          {searchQuery && issues.length !== filteredIssues.length && (
            <span> (toplam {issues.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

