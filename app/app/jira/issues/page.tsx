"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, X, Search, ExternalLink, ChevronRight } from "lucide-react";
import FilterDropdown from "@/components/jira/FilterDropdown";
import FilterChip from "@/components/jira/FilterChip";
import EmptyState from "@/components/jira/EmptyState";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
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

  // Extract unique values for filters with counts
  const statusOptions = useMemo(() => {
    const statusMap = new Map<string, number>();
    issues.forEach((issue) => {
      statusMap.set(issue.status, (statusMap.get(issue.status) || 0) + 1);
    });
    return Array.from(statusMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [issues]);

  const priorityOptions = useMemo(() => {
    const priorityMap = new Map<string, number>();
    issues.forEach((issue) => {
      if (issue.priority) {
        priorityMap.set(issue.priority, (priorityMap.get(issue.priority) || 0) + 1);
      }
    });
    return Array.from(priorityMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [issues]);

  const projectOptions = useMemo(() => {
    const projectMap = new Map<string, number>();
    issues.forEach((issue) => {
      projectMap.set(issue.project.key, (projectMap.get(issue.project.key) || 0) + 1);
    });
    return Array.from(projectMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [issues]);

  const typeOptions = useMemo(() => {
    const typeMap = new Map<string, number>();
    issues.forEach((issue) => {
      typeMap.set(issue.type, (typeMap.get(issue.type) || 0) + 1);
    });
    return Array.from(typeMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [issues]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (projectFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    return count;
  }, [statusFilter, priorityFilter, projectFilter, typeFilter]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
    setTypeFilter("all");
  }, []);

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
          className="min-h-[44px] rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
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
            className="w-full rounded-lg border-2 border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 sm:text-base"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="space-y-3">
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3">
            <FilterDropdown
              label="Durum"
              value={statusFilter}
              options={[
                { value: "all", label: "Tüm Durumlar" },
                ...statusOptions,
              ]}
              onChange={setStatusFilter}
              className="min-w-[160px]"
            />
            <FilterDropdown
              label="Öncelik"
              value={priorityFilter}
              options={[
                { value: "all", label: "Tüm Öncelikler" },
                ...priorityOptions,
              ]}
              onChange={setPriorityFilter}
              className="min-w-[160px]"
            />
            <FilterDropdown
              label="Proje"
              value={projectFilter}
              options={[
                { value: "all", label: "Tüm Projeler" },
                ...projectOptions,
              ]}
              onChange={setProjectFilter}
              className="min-w-[160px]"
            />
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
            <div className="ml-auto flex items-center gap-2 rounded-lg border-2 border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setViewMode("list")}
                className={`min-h-[44px] rounded-lg px-3 py-1.5 text-sm transition ${
                  viewMode === "list"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`min-h-[44px] rounded-lg px-3 py-1.5 text-sm transition ${
                  viewMode === "grid"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border-2 border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Aktif Filtreler:
              </span>
              {statusFilter !== "all" && (
                <FilterChip
                  label={`Durum: ${statusOptions.find((s) => s.value === statusFilter)?.label || statusFilter}`}
                  value={statusFilter}
                  onRemove={() => setStatusFilter("all")}
                  color="blue"
                />
              )}
              {priorityFilter !== "all" && (
                <FilterChip
                  label={`Öncelik: ${priorityOptions.find((p) => p.value === priorityFilter)?.label || priorityFilter}`}
                  value={priorityFilter}
                  onRemove={() => setPriorityFilter("all")}
                  color="green"
                />
              )}
              {projectFilter !== "all" && (
                <FilterChip
                  label={`Proje: ${projectFilter}`}
                  value={projectFilter}
                  onRemove={() => setProjectFilter("all")}
                  color="purple"
                />
              )}
              {typeFilter !== "all" && (
                <FilterChip
                  label={`Tip: ${typeOptions.find((t) => t.value === typeFilter)?.label || typeFilter}`}
                  value={typeFilter}
                  onRemove={() => setTypeFilter("all")}
                  color="orange"
                />
              )}
              <button
                onClick={clearAllFilters}
                className="ml-auto flex min-h-[44px] items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
        <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
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
                className="group relative border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: issue.statusColor === 'green' ? '#16a34a' : issue.statusColor === 'yellow' ? '#eab308' : issue.statusColor === 'blue' ? '#2563eb' : '#6b7280',
                }}
              >
                <div className="relative mb-4 flex items-start justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border-2 border-blue-300 bg-blue-100 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-lg border-2 px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                        issue.statusColor
                      )}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <ExternalLink className="h-5 w-5 shrink-0 text-blue-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
                <h3 className="relative mb-4 line-clamp-2 text-base font-bold text-gray-900 dark:text-white">
                  {issue.summary}
                </h3>
                <div className="relative flex flex-wrap items-center gap-2">
                  <span className="rounded-lg border-2 border-blue-300 bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {issue.project.key}
                  </span>
                  {issue.priority && (
                    <span className={`rounded-lg border-2 px-2 py-1 text-xs font-semibold shadow-sm ${getPriorityColorClasses(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  )}
                  <span className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {issue.type}
                  </span>
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
                className="group relative block border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: issue.statusColor === 'green' ? '#16a34a' : issue.statusColor === 'yellow' ? '#eab308' : issue.statusColor === 'blue' ? '#2563eb' : '#6b7280',
                }}
              >
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg bg-blue-100 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                        {issue.key}
                      </span>
                      <span
                        className={`rounded-lg border-2 px-2.5 py-1 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                      {issue.priority && (
                        <span
                          className={`rounded-lg border-2 px-2 py-1 text-xs font-semibold shadow-sm ${getPriorityColorClasses(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      )}
                      <span className="rounded-lg border-2 border-purple-300 bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {issue.type}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                      {issue.summary}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <span className="font-semibold">Proje:</span>{" "}
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {issue.project.key}
                        </span>
                      </span>
                      {issue.assignee && (
                        <span>
                          <span className="font-semibold">Atanan:</span>{" "}
                          <span className="font-medium">{issue.assignee.name}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-6 w-6 shrink-0 text-blue-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                </div>
              </a>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all" ? Search : ClipboardList}
          title={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? "Issue bulunamadı"
              : "Henüz issue yok"
          }
          description={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? "Arama kriterlerinize uygun issue bulunamadı. Filtreleri temizleyip tekrar deneyin."
              : "Size atanmış Jira issue'ları bulunmuyor. Jira hesabınızda size atanmış issue'lar olduğunda burada görünecektir."
          }
          actionLabel={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? "Filtreleri Temizle"
              : undefined
          }
          onAction={
            searchQuery || statusFilter !== "all" || priorityFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
              ? clearAllFilters
              : undefined
          }
        />
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

