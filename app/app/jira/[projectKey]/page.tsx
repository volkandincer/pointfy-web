"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  X,
  ClipboardList,
  Search,
  Clock,
  CheckCircle2,
  Filter,
  BarChart3,
  FileText,
  User,
  Calendar,
  ExternalLink,
} from "lucide-react";
import type {
  JiraAdfDocument,
  JiraAdfNode,
  JiraTask,
} from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import {
  getStatusColorClasses,
  getPriorityColorClasses,
} from "@/lib/jira/colors";
import JiraIssueModal from "@/components/jira/JiraIssueModal";
import FilterDropdown from "@/components/jira/FilterDropdown";
import FilterChip from "@/components/jira/FilterChip";
import EmptyState from "@/components/jira/EmptyState";

export default function JiraProjectDetailPage() {
  const params = useParams<{ projectKey: string }>();
  const router = useRouter();
  const projectKey = String(params?.projectKey);

  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [projectName, setProjectName] = useState<string>("");

  // Issues state
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [allIssues, setAllIssues] = useState<JiraTask[]>([]); // Filtrelenmemiş tüm issue'lar
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

  // Filter state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "compact">(
    "list"
  );

  // Issue detail modal
  const [selectedIssue, setSelectedIssue] = useState<JiraTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Jira base URL'i al (layout'ta connection check yapılıyor)
  useEffect(() => {
    let mounted = true;
    async function getJiraBaseUrl() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) {
          setLoading(false);
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          if (userRow?.jira_base_url) {
            setJiraBaseUrl(userRow.jira_base_url);
          }
          setLoading(false);
        }
      } catch {
        // Jira base URL fetch error
        if (mounted) {
          setLoading(false);
        }
      }
    }

    getJiraBaseUrl();

    return () => {
      mounted = false;
    };
  }, []);

  // Project issues fetch
  const fetchProjectIssues = useCallback(async () => {
    if (!jiraBaseUrl || !projectKey || loading) {
      return;
    }

    setIssuesLoading(true);
    setIssuesError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);
      urlParams.set("jql", `project=${projectKey}`);

      const response = await fetch(`/api/jira/search?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jql: `project=${projectKey}`,
          maxResults: 100,
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch project issues";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          // JSON parse failed, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // API response format: { issues: JiraTask[], total, startAt, maxResults }
      // API route zaten JiraTask formatına çeviriyor, direkt kullanabiliriz
      const issuesArray = Array.isArray(data.issues) ? data.issues : [];

      if (
        issuesArray.length === 0 &&
        data.total !== undefined &&
        data.total > 0
      ) {
        console.warn("API returned total > 0 but empty issues array", data);
      }

      // Helper function: ADF format description'ı string'e çevir (sadece JiraIssue formatı için gerekli)
      const extractDescription = (
        desc: JiraAdfDocument | string | undefined
      ): string | undefined => {
        if (!desc) return undefined;
        if (typeof desc === "string") return desc;

        const extractText = (node: JiraAdfNode): string => {
          const currentText = node.text ?? "";
          if (node.content && Array.isArray(node.content)) {
            return currentText + node.content.map(extractText).join("");
          }
          return currentText;
        };

        if (Array.isArray(desc.content)) {
          const combined = desc.content.map(extractText).join("").trim();
          return combined || undefined;
        }

        return undefined;
      };

      const tasks: JiraTask[] = [];
      for (const issue of issuesArray) {
        if (!issue) {
          console.warn("Skipping invalid issue (null/undefined)");
          continue;
        }

        // Eğer issue zaten JiraTask formatındaysa (API'den dönüştürülmüşse)
        if (issue.key && issue.summary && !issue.fields) {
          // Zaten JiraTask formatında - direkt kullan
          // URL'i düzelt (eğer yoksa veya yanlışsa)
          const task: JiraTask = {
            ...issue,
            url:
              issue.url ||
              (jiraBaseUrl
                ? `https://${jiraBaseUrl.replace(/^https?:\/\//, "")}/browse/${
                    issue.key
                  }`
                : ""),
            project: {
              key: issue.project?.key || projectKey,
              name: issue.project?.name || projectName || projectKey,
            },
          };
          tasks.push(task);
          continue;
        }

        // Eğer issue JiraIssue formatındaysa (fields var) - bu durumda API route'u düzeltilmeli
        // Ama yine de handle edelim
        if (issue.fields) {
          try {
            const task: JiraTask = {
              id: issue.id || String(Math.random()),
              key: issue.key || "",
              summary: issue.fields?.summary || "",
              description: extractDescription(issue.fields?.description),
              status: issue.fields?.status?.name || "",
              statusColor:
                issue.fields?.status?.statusCategory?.colorName || "gray",
              assignee: issue.fields?.assignee
                ? {
                    name:
                      issue.fields.assignee.displayName ||
                      issue.fields.assignee.name ||
                      "Unknown",
                    avatar:
                      issue.fields.assignee.avatarUrls?.["48x48"] ||
                      issue.fields.assignee.avatarUrls?.["32x32"],
                  }
                : undefined,
              priority: issue.fields?.priority?.name,
              type: issue.fields?.issuetype?.name || "",
              project: {
                key: issue.fields?.project?.key || projectKey,
                name: issue.fields?.project?.name || projectName || projectKey,
              },
              created: issue.fields?.created || "",
              updated: issue.fields?.updated || "",
              resolved: issue.fields?.resolutiondate,
              url: jiraBaseUrl
                ? `https://${jiraBaseUrl.replace(/^https?:\/\//, "")}/browse/${
                    issue.key
                  }`
                : "",
            };

            // Validation: key ve summary olmadan issue ekleme
            if (!task.key || !task.summary) {
              console.warn("Skipping issue with missing key or summary", task);
              continue;
            }

            tasks.push(task);
          } catch (mapError) {
            console.error("Error mapping issue:", mapError, issue);
          }
        } else {
          console.warn("Skipping issue with unknown format", issue);
        }
      }

      setAllIssues(tasks);
      setIssues(tasks);

      // İlk issue'dan proje adını al
      if (tasks.length > 0 && tasks[0].project.name) {
        setProjectName(tasks[0].project.name);
      } else if (tasks.length > 0 && tasks[0].project.key) {
        // Proje adı yoksa key'i kullan
        setProjectName(tasks[0].project.key);
      }
    } catch (err) {
      // Fetch project issues error
      setIssuesError(
        err instanceof Error ? err.message : "Failed to load project issues"
      );
    } finally {
      setIssuesLoading(false);
    }
  }, [jiraBaseUrl, projectKey, projectName, loading]);

  // Proje issue'larını yükle
  useEffect(() => {
    if (!jiraBaseUrl || !projectKey || loading) return;
    fetchProjectIssues();
  }, [jiraBaseUrl, projectKey, loading, fetchProjectIssues]);

  // Filtreleme ve arama
  const filteredIssues = useMemo(() => {
    let filtered = [...allIssues];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (issue) =>
          issue.summary.toLowerCase().includes(query) ||
          issue.description?.toLowerCase().includes(query) ||
          issue.key.toLowerCase().includes(query)
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

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((issue) => issue.type === typeFilter);
    }

    // Assignee filter
    if (assigneeFilter !== "all") {
      if (assigneeFilter === "unassigned") {
        filtered = filtered.filter((issue) => !issue.assignee);
      } else {
        filtered = filtered.filter(
          (issue) => issue.assignee?.name === assigneeFilter
        );
      }
    }

    return filtered;
  }, [
    allIssues,
    searchQuery,
    statusFilter,
    priorityFilter,
    typeFilter,
    assigneeFilter,
  ]);

  // Statuses array for status distribution
  const statuses = useMemo(() => {
    return Array.from(new Set(allIssues.map((issue) => issue.status))).sort();
  }, [allIssues]);

  // Filter options with counts
  const statusOptions = useMemo(() => {
    const statusMap = new Map<string, number>();
    allIssues.forEach((issue) => {
      statusMap.set(issue.status, (statusMap.get(issue.status) || 0) + 1);
    });
    return Array.from(statusMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allIssues]);

  const priorityOptions = useMemo(() => {
    const priorityMap = new Map<string, number>();
    allIssues.forEach((issue) => {
      if (issue.priority) {
        priorityMap.set(
          issue.priority,
          (priorityMap.get(issue.priority) || 0) + 1
        );
      }
    });
    return Array.from(priorityMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allIssues]);

  const typeOptions = useMemo(() => {
    const typeMap = new Map<string, number>();
    allIssues.forEach((issue) => {
      typeMap.set(issue.type, (typeMap.get(issue.type) || 0) + 1);
    });
    return Array.from(typeMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allIssues]);

  const assigneeOptions = useMemo(() => {
    const assigneeMap = new Map<string, number>();
    allIssues.forEach((issue) => {
      if (issue.assignee?.name) {
        assigneeMap.set(
          issue.assignee.name,
          (assigneeMap.get(issue.assignee.name) || 0) + 1
        );
      }
    });
    return Array.from(assigneeMap.entries())
      .map(([value, count]) => ({ value, label: value, count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [allIssues]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== "all") count++;
    if (priorityFilter !== "all") count++;
    if (typeFilter !== "all") count++;
    if (assigneeFilter !== "all") count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [statusFilter, priorityFilter, typeFilter, assigneeFilter, searchQuery]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setTypeFilter("all");
    setAssigneeFilter("all");
  }, []);

  // Filtered issues'ı set et
  useEffect(() => {
    setIssues(filteredIssues);
  }, [filteredIssues]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent dark:border-purple-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Header Section */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/app/jira")}
          className="mb-4 flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Jira&apos;ya Dön
        </button>
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
              {projectName || projectKey}
            </h1>
            {projectKey && (
              <span className="border-2 border-purple-600 bg-purple-50 px-3 py-1.5 font-mono text-sm font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                {projectKey}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Stats */}
      {issuesLoading && allIssues.length === 0 ? (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="group relative border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="mb-2 h-10 w-10 animate-pulse border-2 border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-gray-800" />
              <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="border-2 border-gray-300 bg-white p-4 shadow-sm transition-all hover:border-gray-400 hover:shadow-md sm:p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="border-2 border-purple-600 bg-purple-50 p-2 dark:bg-purple-900/20">
                <ClipboardList className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Toplam Issue
            </div>
            <div className="mt-1 text-base font-bold text-blue-700 dark:text-blue-300">
              {allIssues.length}
            </div>
          </div>
          <div className="border-2 border-gray-300 bg-white p-4 shadow-sm transition-all hover:border-gray-400 hover:shadow-md sm:p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="border-2 border-orange-600 bg-orange-50 p-2 dark:bg-orange-900/20">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Açık
            </div>
            <div className="mt-1 text-base font-bold text-orange-700 dark:text-orange-300">
              {
                allIssues.filter(
                  (i) => i.statusColor !== "green" && !i.resolved
                ).length
              }
            </div>
          </div>
          <div className="border-2 border-gray-300 bg-white p-4 shadow-sm transition-all hover:border-gray-400 hover:shadow-md sm:p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="border-2 border-green-600 bg-green-50 p-2 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Tamamlanan
            </div>
            <div className="mt-1 text-base font-bold text-green-700 dark:text-green-300">
              {
                allIssues.filter((i) => i.statusColor === "green" || i.resolved)
                  .length
              }
            </div>
          </div>
          <div className="border-2 border-gray-300 bg-white p-4 shadow-sm transition-all hover:border-gray-400 hover:shadow-md sm:p-5 dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-2 flex items-center justify-between">
              <div className="border-2 border-purple-600 bg-purple-50 p-2 dark:bg-purple-900/20">
                <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              Filtrelenmiş
            </div>
            <div className="mt-1 text-base font-bold text-purple-700 dark:text-purple-300">
              {filteredIssues.length}
            </div>
          </div>
        </div>
      )}

      {/* Status Distribution Chart */}
      {issuesLoading && allIssues.length === 0 ? (
        <div className="mb-6 border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-9 w-9 animate-pulse border-2 border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-gray-800" />
            <div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-28 h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                <div className="flex-1 h-3 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                <div className="w-16 h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-5 flex items-center gap-2">
            <div className="border-2 border-indigo-600 bg-indigo-50 p-2 dark:bg-indigo-900/20">
              <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Status Dağılımı
            </h3>
          </div>
          <div className="space-y-3">
            {statuses.map((status) => {
              const count = allIssues.filter((i) => i.status === status).length;
              const percentage =
                allIssues.length > 0 ? (count / allIssues.length) * 100 : 0;
              const statusColors: Record<string, string> = {
                Done: "bg-green-600",
                "In Progress": "bg-blue-600",
                "To Do": "bg-gray-500",
                Open: "bg-orange-600",
                Closed: "bg-purple-600",
              };
              const colorClass = statusColors[status] || "bg-blue-600";
              return (
                <div key={status} className="flex items-center gap-4">
                  <div className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {status}
                  </div>
                  <div className="flex-1">
                    <div className="relative h-3 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-800">
                      <div
                        className={`h-full ${colorClass} transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex w-16 items-center justify-between">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="relative mb-6 border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-5">
          <div className="relative flex items-center gap-3">
            <div className="absolute left-3 z-10">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Issue'da ara (başlık, açıklama, key)..."
              className="w-full rounded-md border-2 border-gray-300 bg-gray-50 pl-10 pr-10 py-3 text-base text-gray-900 outline-none transition-all focus:border-purple-600 focus:bg-white focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-purple-500 dark:focus:bg-gray-800 sm:text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 z-10 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <FilterDropdown
              label="Status"
              value={statusFilter}
              options={[{ value: "all", label: "Tümü" }, ...statusOptions]}
              onChange={setStatusFilter}
              className="min-w-[140px]"
            />
            <FilterDropdown
              label="Priority"
              value={priorityFilter}
              options={[{ value: "all", label: "Tümü" }, ...priorityOptions]}
              onChange={setPriorityFilter}
              className="min-w-[140px]"
            />
            <FilterDropdown
              label="Type"
              value={typeFilter}
              options={[{ value: "all", label: "Tümü" }, ...typeOptions]}
              onChange={setTypeFilter}
              className="min-w-[140px]"
            />
            <FilterDropdown
              label="Assignee"
              value={assigneeFilter}
              options={[
                { value: "all", label: "Tümü" },
                { value: "unassigned", label: "Atanmamış" },
                ...assigneeOptions,
              ]}
              onChange={setAssigneeFilter}
              className="min-w-[140px]"
            />
            <FilterDropdown
              label="Görünüm"
              value={viewMode}
              options={[
                { value: "list", label: "Liste" },
                { value: "kanban", label: "Kanban" },
                { value: "compact", label: "Kompakt" },
              ]}
              onChange={(value) =>
                setViewMode(value as "list" | "kanban" | "compact")
              }
              className="min-w-[140px]"
            />
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 border-2 border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                Aktif Filtreler:
              </span>
              {searchQuery.trim() && (
                <FilterChip
                  label={`Arama: "${searchQuery}"`}
                  value="search"
                  onRemove={() => setSearchQuery("")}
                  color="orange"
                />
              )}
              {statusFilter !== "all" && (
                <FilterChip
                  label={`Status: ${
                    statusOptions.find((s) => s.value === statusFilter)
                      ?.label || statusFilter
                  }`}
                  value={statusFilter}
                  onRemove={() => setStatusFilter("all")}
                  color="blue"
                />
              )}
              {priorityFilter !== "all" && (
                <FilterChip
                  label={`Priority: ${
                    priorityOptions.find((p) => p.value === priorityFilter)
                      ?.label || priorityFilter
                  }`}
                  value={priorityFilter}
                  onRemove={() => setPriorityFilter("all")}
                  color="green"
                />
              )}
              {typeFilter !== "all" && (
                <FilterChip
                  label={`Type: ${
                    typeOptions.find((t) => t.value === typeFilter)?.label ||
                    typeFilter
                  }`}
                  value={typeFilter}
                  onRemove={() => setTypeFilter("all")}
                  color="purple"
                />
              )}
              {assigneeFilter !== "all" && (
                <FilterChip
                  label={`Assignee: ${
                    assigneeFilter === "unassigned"
                      ? "Atanmamış"
                      : assigneeOptions.find((a) => a.value === assigneeFilter)
                          ?.label || assigneeFilter
                  }`}
                  value={assigneeFilter}
                  onRemove={() => setAssigneeFilter("all")}
                  color="gray"
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

        {/* Results Count */}
        <div className="mt-4 flex items-center justify-between border-2 border-purple-300 bg-purple-50 px-4 py-2.5 dark:border-purple-700 dark:bg-purple-950/20">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              {filteredIssues.length} / {allIssues.length} issue gösteriliyor
            </span>
          </div>
          {filteredIssues.length !== allIssues.length && (
            <span className="text-xs text-purple-600 dark:text-purple-400">
              {((filteredIssues.length / allIssues.length) * 100).toFixed(0)}%
              eşleşti
            </span>
          )}
        </div>
      </div>

      {/* Issues List */}
      <div className="rounded-md border-2 border-gray-300 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Issue&apos;lar{" "}
              {filteredIssues.length !== allIssues.length &&
                `(${filteredIssues.length})`}
            </h2>
            <button
              onClick={fetchProjectIssues}
              disabled={issuesLoading}
              className="rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50"
            >
              {issuesLoading ? "Yükleniyor..." : "Yenile"}
            </button>
          </div>

          {issuesError && (
            <div className="mb-4 border-2 border-red-300 bg-red-50 p-3 text-sm text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
              {issuesError}
            </div>
          )}

          {issuesLoading && issues.length === 0 ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="group relative block border-l-4 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <div className="h-6 w-16 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
                        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
                      </div>
                      <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="mb-3 h-4 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="mb-2 h-4 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                      <div className="mt-3 flex flex-wrap items-center gap-4 rounded-md bg-gray-50/50 px-3 py-2.5 dark:bg-gray-800/50">
                        <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                        <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                      </div>
                    </div>
                    <div className="h-10 w-10 animate-pulse rounded-md bg-gray-200 dark:bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : issues.length > 0 ? (
            <>
              {/* Kanban View */}
              {viewMode === "kanban" && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {statuses.map((status) => {
                    const statusIssues = issues.filter(
                      (issue) => issue.status === status
                    );
                    if (statusIssues.length === 0) return null;
                    return (
                      <div key={status} className="flex flex-col">
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {status}
                          </h3>
                          <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {statusIssues.length}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {statusIssues.map((issue) => (
                            <button
                              key={issue.id}
                              onClick={() => {
                                if (issue.key) {
                                  router.push(`/app/jira/issues/${issue.key}`);
                                }
                              }}
                              disabled={!issue.key}
                              className="group block w-full cursor-pointer rounded-md border-2 border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:border-purple-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
                            >
                              <div className="mb-1 flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                                  {issue.key}
                                </span>
                                {issue.priority && (
                                  <span className="rounded-md border-2 border-gray-300 bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {issue.priority}
                                  </span>
                                )}
                              </div>
                              <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                {issue.summary}
                              </h4>
                              {issue.assignee && (
                                <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">
                                    {issue.assignee.name}
                                  </span>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compact View */}
              {viewMode === "compact" && (
                <div className="space-y-2">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        if (issue.key) {
                          router.push(`/app/jira/issues/${issue.key}`);
                        }
                      }}
                      disabled={!issue.key}
                      className="group flex w-full cursor-pointer items-center gap-3 rounded-md border-2 border-gray-200 bg-white p-3 text-left transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-purple-900/20"
                    >
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {issue.key}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                        {issue.summary}
                      </span>
                      <span
                        className={`rounded-md border-2 px-2 py-0.5 text-xs font-medium shadow-sm ${getStatusColorClasses(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* List View (Default) */}
              {viewMode === "list" && (
                <div className="space-y-4">
                  {issues.map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() => {
                        if (issue.key) {
                          router.push(`/app/jira/issues/${issue.key}`);
                        }
                      }}
                      disabled={!issue.key}
                      className="group relative block w-full border-l-4 border-l-purple-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 text-left shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          {/* Header: Key, Status, Priority */}
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-blue-100 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                              {issue.key}
                            </span>
                            <span
                              className={`rounded-md border-2 px-3 py-1 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                                issue.statusColor
                              )}`}
                            >
                              {issue.status}
                            </span>
                            {issue.priority && (
                              <span
                                className={`rounded-md border-2 px-3 py-1 text-xs font-semibold shadow-sm ${getPriorityColorClasses(
                                  issue.priority
                                )}`}
                              >
                                {issue.priority}
                              </span>
                            )}
                            {issue.type && (
                              <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                {issue.type}
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="mb-2 text-base font-bold leading-snug text-gray-900 dark:text-white">
                            {issue.summary}
                          </h3>

                          {/* Description */}
                          {issue.description && (
                            <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                              {issue.description}
                            </p>
                          )}

                          {/* Footer: Metadata */}
                          <div className="flex flex-wrap items-center gap-4 rounded-md bg-gray-50/50 px-3 py-2.5 dark:bg-gray-800/50">
                            {issue.assignee && (
                              <span className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                {issue.assignee.avatar && (
                                  <Image
                                    src={issue.assignee.avatar}
                                    alt={issue.assignee.name}
                                    width={20}
                                    height={20}
                                    className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-gray-700"
                                  />
                                )}
                                <span>{issue.assignee.name}</span>
                              </span>
                            )}
                            {issue.created && (
                              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                {new Date(issue.created).toLocaleDateString(
                                  "tr-TR",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* External Link Icon */}
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-purple-100 text-purple-600 opacity-0 transition-all group-hover:opacity-100 dark:bg-purple-900/30 dark:text-purple-400">
                            <ExternalLink className="h-5 w-5" />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={allIssues.length === 0 ? ClipboardList : Search}
              title={
                allIssues.length === 0
                  ? "Bu projede issue bulunamadı"
                  : "Filtrelere uygun issue bulunamadı"
              }
              description={
                allIssues.length === 0
                  ? "Bu projede henüz issue oluşturulmamış. Issue'lar oluşturulduğunda burada görünecektir."
                  : "Arama kriterlerinize uygun issue bulunamadı. Filtreleri temizleyip tekrar deneyin."
              }
              actionLabel={
                allIssues.length === 0 ? undefined : "Filtreleri Temizle"
              }
              onAction={allIssues.length === 0 ? undefined : clearAllFilters}
            />
          )}
        </div>
      </div>
      <JiraIssueModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIssue(null);
        }}
      />
    </div>
  );
}
