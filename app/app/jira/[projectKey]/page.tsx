"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import JiraIssueModal from "@/components/jira/JiraIssueModal";
import MobileSelect from "@/components/jira/MobileSelect";

export default function JiraProjectDetailPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );

  const params = useParams<{ projectKey: string }>();
  const router = useRouter();
  const projectKey = String(params?.projectKey);

  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
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
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "compact">("list");

  // Issue detail modal
  const [selectedIssue, setSelectedIssue] = useState<JiraTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Jira bağlantı durumunu kontrol et
  useEffect(() => {
    let mounted = true;
    async function checkJiraConnection() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) {
          setLoading(false);
          return;
        }

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_access_token, jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          setJiraConnected(!!userRow?.jira_access_token);
          if (userRow?.jira_base_url) {
            setJiraBaseUrl(userRow.jira_base_url);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error("Jira connection check error:", err);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkJiraConnection();

    return () => {
      mounted = false;
    };
  }, []);

  // Project issues fetch
  const fetchProjectIssues = useCallback(async () => {
    if (!jiraBaseUrl || !projectKey) {
      setIssuesError("Jira URL'i veya proje key'i bulunamadı.");
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

      const data = await response.json();

      console.log("🔍 Project Issues API Response:", {
        status: response.status,
        ok: response.ok,
        dataKeys: Object.keys(data),
        issuesCount: data.issues?.length || 0,
        total: data.total,
        data: data,
      });

      if (!response.ok) {
        console.error("❌ Project Issues API Error:", data);
        throw new Error(data.error || "Failed to fetch project issues");
      }

      // Issues'ları JiraTask formatına çevir
      const issuesArray = data.issues || [];
      console.log("📦 Issues array:", issuesArray.length, issuesArray);
      
      if (issuesArray.length === 0) {
        console.warn("⚠️ No issues found in response");
      }

      // Helper function: ADF format description'ı string'e çevir
      const extractDescription = (desc: any): string | undefined => {
        if (!desc) return undefined;
        if (typeof desc === "string") return desc;
        if (typeof desc === "object" && desc.content) {
          // ADF format - content array'inden text'leri çıkar
          const extractText = (node: any): string => {
            if (typeof node === "string") return node;
            if (node.text) return node.text;
            if (node.content && Array.isArray(node.content)) {
              return node.content.map(extractText).join("");
            }
            return "";
          };
          return desc.content.map(extractText).join("").trim() || undefined;
        }
        return undefined;
      };

      const tasks: JiraTask[] = [];
      for (const issue of issuesArray) {
        if (!issue || !issue.fields) continue;
        try {
          tasks.push({
            id: issue.id,
            key: issue.key,
            summary: issue.fields?.summary || "",
            description: extractDescription(issue.fields?.description),
            status: issue.fields?.status?.name || "",
            statusColor: issue.fields?.status?.statusCategory?.colorName || "gray",
            assignee: issue.fields?.assignee
              ? {
                  name: issue.fields.assignee.displayName,
                  avatar: issue.fields.assignee.avatarUrls?.["48x48"],
                }
              : undefined,
            priority: issue.fields?.priority?.name,
            type: issue.fields?.issuetype?.name || "",
            project: {
              key: issue.fields?.project?.key || projectKey,
              name: issue.fields?.project?.name || projectName,
            },
            created: issue.fields?.created || "",
            updated: issue.fields?.updated || "",
            resolved: issue.fields?.resolutiondate,
            url: jiraBaseUrl
              ? `https://${jiraBaseUrl}/browse/${issue.key}`
              : `https://${jiraBaseUrl}/browse/${issue.key}`,
          });
        } catch (mapError) {
          console.error("❌ Issue mapping error:", mapError, issue);
        }
      }

      console.log("✅ Mapped tasks:", tasks.length, tasks);
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
      console.error("Fetch project issues error:", err);
      setIssuesError(err instanceof Error ? err.message : "Failed to load project issues");
    } finally {
      setIssuesLoading(false);
    }
  }, [jiraBaseUrl, projectKey, projectName]);

  // Proje issue'larını yükle
  useEffect(() => {
    if (!jiraConnected || !jiraBaseUrl || !projectKey) return;
    fetchProjectIssues();
  }, [jiraConnected, jiraBaseUrl, projectKey, fetchProjectIssues]);

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
  }, [allIssues, searchQuery, statusFilter, priorityFilter, typeFilter, assigneeFilter]);

  // Filter options
  const statuses = useMemo(() => {
    const uniqueStatuses = Array.from(
      new Set(allIssues.map((issue) => issue.status))
    ).sort();
    return uniqueStatuses;
  }, [allIssues]);

  const priorities = useMemo(() => {
    const uniquePriorities = Array.from(
      new Set(allIssues.map((issue) => issue.priority).filter((p): p is string => Boolean(p)))
    ).sort();
    return uniquePriorities;
  }, [allIssues]);

  const types = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(allIssues.map((issue) => issue.type))
    ).sort();
    return uniqueTypes;
  }, [allIssues]);

  const assignees = useMemo(() => {
    const uniqueAssignees = Array.from(
      new Set(
        allIssues
          .map((issue) => issue.assignee?.name)
          .filter(Boolean) as string[]
      )
    ).sort();
    return uniqueAssignees;
  }, [allIssues]);

  // Filtered issues'ı set et
  useEffect(() => {
    setIssues(filteredIssues);
  }, [filteredIssues]);

  if (loading) {
    return (
      <RequireAuth>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-16">
            <div className="flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </RequireAuth>
    );
  }

  if (!jiraConnected) {
    return (
      <RequireAuth>
        <Header navigationItems={navigationItems} />
        <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
          <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-2xl border border-blue-200/70 bg-white p-8 shadow-lg dark:border-blue-800/70 dark:bg-gray-900">
                <div className="mb-6 text-center">
                  <div className="mb-4 text-6xl">🔗</div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
                    Jira Bağlantısı Gerekli
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Jira projelerinizi görüntülemek için Jira hesabınızı bağlamanız gerekiyor.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const supabase = getSupabase();
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData.user) return;

                      const returnUrl = encodeURIComponent(`/app/jira/${projectKey}`);
                      const encodedUserId = encodeURIComponent(userData.user.id);
                      window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                    } catch (err) {
                      console.error("Jira OAuth error:", err);
                    }
                  }}
                  className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3 text-base font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg"
                >
                  Jira'yı Bağla
                </button>
              </div>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <Header navigationItems={navigationItems} />
      <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="container mx-auto px-4 py-12">
          <div className="mx-auto max-w-7xl">
            {/* Header Section */}
            <div className="mb-8">
              <button
                onClick={() => router.push("/app/jira")}
                className="mb-4 flex items-center text-sm text-gray-600 transition hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Jira'ya Dön
              </button>
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                    {projectName || projectKey}
                  </h1>
                  {projectKey && (
                    <span className="rounded-lg bg-blue-100 px-3 py-1.5 font-mono text-sm font-bold text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
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
                    className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-800/50 dark:bg-gray-900"
                  >
                    <div className="mb-2 h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
                    <div className="mb-2 h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                    <div className="h-8 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800/50 dark:from-blue-950/30 dark:to-blue-900/20">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-blue-500/10 p-2 dark:bg-blue-500/20">
                      <svg
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Toplam Issue
                  </div>
                  <div className="mt-1 text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {allIssues.length}
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800/50 dark:from-orange-950/30 dark:to-orange-900/20">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-orange-500/10 p-2 dark:bg-orange-500/20">
                      <svg
                        className="h-5 w-5 text-orange-600 dark:text-orange-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Açık</div>
                  <div className="mt-1 text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {allIssues.filter((i) => i.statusColor !== "green" && !i.resolved).length}
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-green-50 to-green-100/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800/50 dark:from-green-950/30 dark:to-green-900/20">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-green-500/10 p-2 dark:bg-green-500/20">
                      <svg
                        className="h-5 w-5 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Tamamlanan
                  </div>
                  <div className="mt-1 text-3xl font-bold text-green-700 dark:text-green-300">
                    {allIssues.filter((i) => i.statusColor === "green" || i.resolved).length}
                  </div>
                </div>
              </div>
              <div className="group relative overflow-hidden rounded-xl border border-gray-200/50 bg-gradient-to-br from-purple-50 to-purple-100/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800/50 dark:from-purple-950/30 dark:to-purple-900/20">
                <div className="relative z-10">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="rounded-lg bg-purple-500/10 p-2 dark:bg-purple-500/20">
                      <svg
                        className="h-5 w-5 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Filtrelenmiş
                  </div>
                  <div className="mt-1 text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {filteredIssues.length}
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Status Distribution Chart */}
            {issuesLoading && allIssues.length === 0 ? (
              <div className="mb-6 overflow-hidden rounded-xl border border-gray-200/50 bg-white p-6 shadow-sm dark:border-gray-800/50 dark:bg-gray-900">
                <div className="mb-5 flex items-center gap-2">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
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
              <div className="mb-6 overflow-hidden rounded-xl border border-gray-200/50 bg-white p-6 shadow-sm dark:border-gray-800/50 dark:bg-gray-900">
              <div className="mb-5 flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-2">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Status Dağılımı
                </h3>
              </div>
              <div className="space-y-3">
                {statuses.map((status) => {
                  const count = allIssues.filter((i) => i.status === status).length;
                  const percentage = allIssues.length > 0 ? (count / allIssues.length) * 100 : 0;
                  const statusColors: Record<string, string> = {
                    Done: "from-green-500 to-emerald-600",
                    "In Progress": "from-blue-500 to-cyan-600",
                    "To Do": "from-gray-400 to-gray-500",
                    Open: "from-orange-500 to-amber-600",
                    Closed: "from-purple-500 to-indigo-600",
                  };
                  const colorClass =
                    statusColors[status] || "from-blue-500 to-indigo-600";
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium text-gray-700 dark:text-gray-300">
                        {status}
                      </div>
                      <div className="flex-1">
                        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                          <div
                            className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-500 ease-out`}
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
            <div className="relative mb-6 overflow-visible rounded-xl border border-gray-200/50 bg-white p-6 shadow-sm dark:border-gray-800/50 dark:bg-gray-900">
              <div className="mb-5">
                <div className="relative flex items-center gap-3">
                  <div className="absolute left-3 z-10">
                    <svg
                      className="h-5 w-5 text-gray-400"
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Issue'da ara (başlık, açıklama, key)..."
                    className="w-full rounded-lg border border-gray-300 bg-gray-50/50 pl-10 pr-10 py-3 text-base text-gray-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:focus:bg-gray-800 sm:text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 z-10 rounded-md p-1.5 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {/* Status Filter */}
                <MobileSelect
                  value={statusFilter}
                  onChange={setStatusFilter}
                  label="Status"
                  options={[
                    { value: "all", label: "Tümü" },
                    ...statuses.map((status) => ({ value: status, label: status })),
                  ]}
                />

                {/* Priority Filter */}
                <MobileSelect
                  value={priorityFilter}
                  onChange={setPriorityFilter}
                  label="Priority"
                  options={[
                    { value: "all", label: "Tümü" },
                    ...priorities.filter(Boolean).map((priority) => ({ value: priority, label: priority })),
                  ]}
                />

                {/* Type Filter */}
                <MobileSelect
                  value={typeFilter}
                  onChange={setTypeFilter}
                  label="Type"
                  options={[
                    { value: "all", label: "Tümü" },
                    ...types.map((type) => ({ value: type, label: type })),
                  ]}
                />

                {/* Assignee Filter */}
                <MobileSelect
                  value={assigneeFilter}
                  onChange={setAssigneeFilter}
                  label="Assignee"
                  options={[
                    { value: "all", label: "Tümü" },
                    { value: "unassigned", label: "Atanmamış" },
                    ...assignees.map((assignee) => ({ value: assignee, label: assignee })),
                  ]}
                />

                {/* View Mode */}
                <MobileSelect
                  value={viewMode}
                  onChange={(value) => setViewMode(value as "list" | "kanban" | "compact")}
                  label="Görünüm"
                  options={[
                    { value: "list", label: "Liste" },
                    { value: "kanban", label: "Kanban" },
                    { value: "compact", label: "Kompakt" },
                  ]}
                />
              </div>

              {/* Active Filters Summary */}
              {(searchQuery ||
                statusFilter !== "all" ||
                priorityFilter !== "all" ||
                typeFilter !== "all" ||
                assigneeFilter !== "all") && (
                <div className="mt-5 rounded-lg bg-gray-50/50 p-4 dark:bg-gray-800/50">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-4 w-4 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Aktif Filtreler
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setTypeFilter("all");
                        setAssigneeFilter("all");
                      }}
                      className="rounded-lg bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Tümünü Temizle
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        <span>Arama:</span>
                        <span className="font-semibold">{searchQuery}</span>
                        <button
                          onClick={() => setSearchQuery("")}
                          className="ml-1 rounded-full p-0.5 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    )}
                    {statusFilter !== "all" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <span>Status:</span>
                        <span className="font-semibold">{statusFilter}</span>
                        <button
                          onClick={() => setStatusFilter("all")}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    )}
                    {priorityFilter !== "all" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <span>Priority:</span>
                        <span className="font-semibold">{priorityFilter}</span>
                        <button
                          onClick={() => setPriorityFilter("all")}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    )}
                    {typeFilter !== "all" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <span>Type:</span>
                        <span className="font-semibold">{typeFilter}</span>
                        <button
                          onClick={() => setTypeFilter("all")}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    )}
                    {assigneeFilter !== "all" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        <span>Assignee:</span>
                        <span className="font-semibold">
                          {assigneeFilter === "unassigned" ? "Atanmamış" : assigneeFilter}
                        </span>
                        <button
                          onClick={() => setAssigneeFilter("all")}
                          className="ml-1 rounded-full p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Results Count */}
              <div className="mt-4 flex items-center justify-between rounded-lg bg-blue-50/50 px-4 py-2.5 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                    {filteredIssues.length} / {allIssues.length} issue gösteriliyor
                  </span>
                </div>
                {filteredIssues.length !== allIssues.length && (
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {((filteredIssues.length / allIssues.length) * 100).toFixed(0)}% eşleşti
                  </span>
                )}
              </div>
            </div>

            {/* Issues List */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Issue'lar {filteredIssues.length !== allIssues.length && `(${filteredIssues.length})`}
                  </h2>
                  <button
                    onClick={fetchProjectIssues}
                    disabled={issuesLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50"
                  >
                    {issuesLoading ? "Yükleniyor..." : "Yenile"}
                  </button>
                </div>

                {issuesError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {issuesError}
                  </div>
                )}

                {issuesLoading && issues.length === 0 ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="group relative block overflow-hidden rounded-xl border-2 border-l-4 border-l-blue-500 border-blue-400/15 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm dark:border-blue-500/10 dark:from-gray-900 dark:to-gray-800/50"
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
                            <div className="mt-3 flex flex-wrap items-center gap-4 rounded-lg bg-gray-50/50 px-3 py-2.5 dark:bg-gray-800/50">
                              <div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                              <div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                            </div>
                          </div>
                          <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
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
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                  {statusIssues.length}
                                </span>
                              </div>
                              <div className="space-y-2">
                                {statusIssues.map((issue) => (
                                  <div
                                    key={issue.id}
                                    onClick={() => {
                                      setSelectedIssue(issue);
                                      setIsModalOpen(true);
                                    }}
                                    className="group block cursor-pointer rounded-lg border-2 border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                                  >
                                    <div className="mb-1 flex items-center gap-1.5">
                                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {issue.key}
                                      </span>
                                      {issue.priority && (
                                        <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                          {issue.priority}
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="mb-1 line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                                      {issue.summary}
                                    </h4>
                                    {issue.assignee && (
                                      <div className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <svg
                                          className="h-3 w-3"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                          />
                                        </svg>
                                        <span className="truncate">
                                          {issue.assignee.name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
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
                          <div
                            key={issue.id}
                            onClick={() => {
                              setSelectedIssue(issue);
                              setIsModalOpen(true);
                            }}
                            className="group flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                          >
                            <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                              {issue.key}
                            </span>
                            <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                              {issue.summary}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                issue.statusColor === "green"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : issue.statusColor === "yellow"
                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                              }`}
                            >
                              {issue.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* List View (Default) */}
                    {viewMode === "list" && (
                      <div className="space-y-4">
                        {issues.map((issue) => (
                      <div
                        key={issue.id}
                        className="group relative block overflow-hidden rounded-xl border-2 border-l-4 border-l-blue-500 border-blue-400/15 bg-gradient-to-br from-white to-gray-50/50 p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-lg dark:border-blue-500/10 dark:from-gray-900 dark:to-gray-800/50 dark:hover:border-blue-500/30 cursor-pointer"
                        onClick={() => {
                          setSelectedIssue(issue);
                          setIsModalOpen(true);
                        }}
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            {/* Header: Key, Status, Priority */}
                            <div className="mb-3 flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-blue-100 px-2.5 py-1 font-mono text-xs font-bold text-blue-700 shadow-sm dark:bg-blue-900/30 dark:text-blue-400">
                                {issue.key}
                              </span>
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${
                                  issue.statusColor === "green"
                                    ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-400"
                                    : issue.statusColor === "yellow"
                                    ? "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-400"
                                    : issue.statusColor === "blue-gray"
                                    ? "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 dark:from-blue-900/30 dark:to-cyan-900/30 dark:text-blue-400"
                                    : "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 dark:from-gray-700 dark:to-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {issue.status}
                              </span>
                              {issue.priority && (
                                <span className="rounded-full bg-gradient-to-r from-orange-100 to-amber-100 px-3 py-1 text-xs font-semibold text-orange-700 shadow-sm dark:from-orange-900/30 dark:to-amber-900/30 dark:text-orange-400">
                                  {issue.priority}
                                </span>
                              )}
                              {issue.type && (
                                <span className="rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 px-3 py-1 text-xs font-semibold text-purple-700 shadow-sm dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-400">
                                  {issue.type}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="mb-2 text-lg font-bold leading-snug text-gray-900 dark:text-white">
                              {issue.summary}
                            </h3>

                            {/* Description */}
                            {issue.description && (
                              <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                {issue.description}
                              </p>
                            )}

                            {/* Footer: Metadata */}
                            <div className="flex flex-wrap items-center gap-4 rounded-lg bg-gray-50/50 px-3 py-2.5 dark:bg-gray-800/50">
                              {issue.assignee && (
                                <span className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                                  {issue.assignee.avatar && (
                                    <img
                                      src={issue.assignee.avatar}
                                      alt={issue.assignee.name}
                                      className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-gray-700"
                                    />
                                  )}
                                  <span>{issue.assignee.name}</span>
                                </span>
                              )}
                              {issue.created && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                                  <svg
                                    className="h-4 w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                  {new Date(issue.created).toLocaleDateString("tr-TR", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* External Link Icon */}
                          <div className="flex-shrink-0">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600 opacity-0 transition-all group-hover:opacity-100 dark:bg-blue-900/30 dark:text-blue-400">
                              <svg
                                className="h-5 w-5"
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
                          </div>
                        </div>
                      </div>
                      ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    {allIssues.length === 0
                      ? "Bu projede issue bulunamadı"
                      : "Filtrelere uygun issue bulunamadı"}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
      <JiraIssueModal
        issue={selectedIssue}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIssue(null);
        }}
      />
    </RequireAuth>
  );
}

