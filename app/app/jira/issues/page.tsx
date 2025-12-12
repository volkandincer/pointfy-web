"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, X, Search, ExternalLink, ChevronRight, Filter, Plus } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
import CreateJiraIssueModal from "@/components/tasks/CreateJiraIssueModal";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import type { JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import { useToastContext } from "@/contexts/ToastContext";
import { formatErrorMessage } from "@/lib/utils/errorHandler";

export default function JiraIssuesPage() {
  const router = useRouter();
  const { showToast } = useToastContext();
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");

  // Issues state
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<JiraTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  
  // Create issue modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  
  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);

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
      setError(formatErrorMessage(err));
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
    <div className="space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
          Issue&apos;larım
        </h1>
      </div>

      {/* Search - En Üstte */}
      <div className="relative">
        <input
          type="text"
          placeholder="Issue ara (key, summary, project)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2.5 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500"
        />
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>

      {/* Action Buttons - Tek Satırda, Aynı Yükseklikte */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={fetchIssues}
          disabled={loading}
          className="!h-10 !min-h-10 !py-2 !border-gray-300 !bg-white !text-gray-700 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-700"
        >
          {loading ? "Yükleniyor..." : "Yenile"}
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowCreateModal(true)}
          icon={Plus}
          className="!h-10 !min-h-10 !py-2 !border-purple-600 !bg-purple-600 !text-white hover:!border-purple-700 hover:!bg-purple-700 dark:!border-purple-500 dark:!bg-purple-600 dark:!text-white dark:hover:!border-purple-400 dark:hover:!bg-purple-500"
        >
          Yeni Issue
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilterModal(true)}
          icon={Filter}
          className={`!h-10 !min-h-10 !py-2 !border-gray-300 !bg-white !text-gray-700 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-700 ${
            activeFiltersCount > 0 ? "!border-purple-600 !bg-purple-50 !text-purple-700 dark:!border-purple-500 dark:!bg-purple-900/20 dark:!text-purple-400" : ""
          }`}
        >
          Filtrele
          {activeFiltersCount > 0 && (
            <span className="ml-1.5 rounded-md border-2 border-purple-600 bg-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white dark:border-purple-500 dark:bg-purple-600 dark:text-white">
              {activeFiltersCount}
            </span>
          )}
        </Button>
        <div className="flex h-10 items-center gap-0.5 rounded-md border-2 border-gray-300 bg-white p-0 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setViewMode("list")}
            className={`flex h-full flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("grid")}
            className={`flex h-full flex-1 items-center justify-center rounded-md px-3 text-xs font-semibold transition ${
              viewMode === "grid"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Grid
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="flex items-center gap-1 rounded-md border-2 border-blue-600 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {statusFilter}
              <X className="h-3 w-3" />
            </button>
          )}
          {priorityFilter !== "all" && (
            <button
              onClick={() => setPriorityFilter("all")}
              className="flex items-center gap-1 rounded-md border-2 border-green-600 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 transition-colors hover:bg-green-100 dark:border-green-500 dark:bg-green-900/20 dark:text-green-400"
            >
              {priorityFilter}
              <X className="h-3 w-3" />
            </button>
          )}
          {projectFilter !== "all" && (
            <button
              onClick={() => setProjectFilter("all")}
              className="flex items-center gap-1 rounded-md border-2 border-purple-600 bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700 transition-colors hover:bg-purple-100 dark:border-purple-500 dark:bg-purple-900/20 dark:text-purple-400"
            >
              {projectFilter}
              <X className="h-3 w-3" />
            </button>
          )}
          {typeFilter !== "all" && (
            <button
              onClick={() => setTypeFilter("all")}
              className="flex items-center gap-1 rounded-md border-2 border-orange-600 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-500 dark:bg-orange-900/20 dark:text-orange-400"
            >
              {typeFilter}
              <X className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={clearAllFilters}
            className="ml-auto rounded-md border-2 border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Tümünü Temizle
          </button>
        </div>
      )}

      {/* Filter Modal */}
      <Modal
        open={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                Filtreler
              </span>
            </div>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="rounded-md border-2 border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Tümünü Temizle
              </button>
            )}
          </div>
        }
      >
        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Durum
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                  statusFilter === "all"
                    ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600"
                    : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                }`}
              >
                Tümü
              </button>
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    statusFilter === option.value
                      ? "border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-600"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          {priorityOptions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Öncelik
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPriorityFilter("all")}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    priorityFilter === "all"
                      ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-600"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  Tümü
                </button>
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setPriorityFilter(option.value)}
                    className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                      priorityFilter === option.value
                        ? "border-green-600 bg-green-600 text-white dark:border-green-500 dark:bg-green-600"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project Filter */}
          {projectOptions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Proje
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setProjectFilter("all")}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    projectFilter === "all"
                      ? "border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-600"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  Tümü
                </button>
                {projectOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setProjectFilter(option.value)}
                    className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                      projectFilter === option.value
                        ? "border-purple-600 bg-purple-600 text-white dark:border-purple-500 dark:bg-purple-600"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type Filter */}
          {typeOptions.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Tip
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTypeFilter("all")}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                    typeFilter === "all"
                      ? "border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-600"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                  }`}
                >
                  Tümü
                </button>
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTypeFilter(option.value)}
                    className={`rounded-md border-2 px-3 py-2 text-sm font-semibold transition-all ${
                      typeFilter === option.value
                        ? "border-orange-600 bg-orange-600 text-white dark:border-orange-500 dark:bg-orange-600"
                        : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Error Message */}
      {error && (
        <div className="rounded-md border-2 border-red-200 bg-red-50 p-3 text-xs text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Issues Content */}
      {loading && issues.length === 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3" : "space-y-2 sm:space-y-3"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-28 animate-pulse border-l-4 border-l-gray-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm dark:border-l-gray-500 dark:border-gray-700 dark:bg-gray-900 ${
                viewMode === "list" ? "w-full" : ""
              }`}
            />
          ))}
        </div>
      ) : filteredIssues.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => {
                  if (issue.key) {
                    router.push(`/app/jira/issues/${issue.key}`);
                  }
                }}
                disabled={!issue.key}
                className="group relative block w-full border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: issue.statusColor === 'green' ? '#16a34a' : issue.statusColor === 'yellow' ? '#eab308' : issue.statusColor === 'blue' ? '#2563eb' : '#6b7280',
                }}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-semibold ${getStatusColorClasses(
                        issue.statusColor
                      )}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-purple-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-purple-400" />
                </div>
                <h3 className="mb-2 line-clamp-2 text-xs font-bold text-gray-900 dark:text-white">
                  {issue.summary}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                    {issue.project.key}
                  </span>
                  {issue.priority && (
                    <span className={`rounded-md border-2 px-1.5 py-0.5 text-[10px] font-semibold ${getPriorityColorClasses(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  )}
                  <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    {issue.type}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => {
                  if (issue.key) {
                    router.push(`/app/jira/issues/${issue.key}`);
                  }
                }}
                disabled={!issue.key}
                className="group relative block w-full border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 text-left shadow-sm transition-all hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
                style={{
                  borderLeftColor: issue.statusColor === 'green' ? '#16a34a' : issue.statusColor === 'yellow' ? '#eab308' : issue.statusColor === 'blue' ? '#2563eb' : '#6b7280',
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-2 py-0.5 font-mono text-[10px] font-bold text-purple-700 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {issue.key}
                      </span>
                      <span
                        className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-semibold ${getStatusColorClasses(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                      {issue.priority && (
                        <span
                          className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-semibold ${getPriorityColorClasses(
                            issue.priority
                          )}`}
                        >
                          {issue.priority}
                        </span>
                      )}
                      <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {issue.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white sm:text-base">
                      {issue.summary}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">
                      <span>
                        <span className="font-semibold">Proje:</span>{" "}
                        <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-purple-600 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-purple-400" />
                </div>
              </button>
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
        <div className="text-center text-xs text-gray-600 dark:text-gray-400">
          {filteredIssues.length} issue gösteriliyor
          {searchQuery && issues.length !== filteredIssues.length && (
            <span> (toplam {issues.length})</span>
          )}
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateJiraIssueModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={async (issueKey, issueUrl) => {
          showToast(`Issue başarıyla oluşturuldu: ${issueKey}`, "success");
          setShowCreateModal(false);
          // Issues listesini yenile
          await fetchIssues();
          // Yeni oluşturulan issue'ya yönlendir
          router.push(`/app/jira/issues/${issueKey}`);
        }}
      />
    </div>
  );
}

