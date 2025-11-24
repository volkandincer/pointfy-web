"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { JiraBoard, JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

type TabType = "projects" | "issues";

export default function JiraPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );

  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Projects state
  const [projects, setProjects] = useState<JiraBoard[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Issues state
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);

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

    // OAuth callback kontrolü
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("jira_connected") === "true") {
      setTimeout(() => {
        checkJiraConnection();
      }, 1000);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Projects fetch
  const fetchProjects = useCallback(async () => {
    if (!jiraBaseUrl) {
      setProjectsError("Jira URL'i bulunamadı.");
      return;
    }

    setProjectsLoading(true);
    setProjectsError(null);

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
        throw new Error(data.error || "Failed to fetch projects");
      }

      setProjects(data.boards || []);
    } catch (err) {
      console.error("Fetch projects error:", err);
      setProjectsError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setProjectsLoading(false);
    }
  }, [jiraBaseUrl]);

  // Issues fetch
  const fetchIssues = useCallback(async () => {
    if (!jiraBaseUrl) {
      setIssuesError("Jira URL'i bulunamadı.");
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

      const response = await fetch(`/api/jira/issues?${urlParams.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();

      console.log("🔍 Issues API Response:", {
        status: response.status,
        ok: response.ok,
        dataKeys: Object.keys(data),
        issuesCount: data.issues?.length || 0,
        total: data.total,
        error: data.error,
      });

      if (!response.ok) {
        console.error("❌ Issues API Error:", data);
        throw new Error(data.error || "Failed to fetch issues");
      }

      console.log("✅ Issues loaded:", data.issues?.length || 0, "issues");
      setIssues(data.issues || []);
    } catch (err) {
      console.error("Fetch issues error:", err);
      setIssuesError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, [jiraBaseUrl]);

  // Tab değiştiğinde ilgili datayı yükle
  useEffect(() => {
    if (!jiraConnected || !jiraBaseUrl) return;

    if (activeTab === "projects") {
      fetchProjects();
    } else if (activeTab === "issues") {
      fetchIssues();
    }
  }, [activeTab, jiraConnected, jiraBaseUrl, fetchProjects, fetchIssues]);

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
                    Jira projelerinizi ve issue'larınızı görüntülemek için Jira hesabınızı bağlamanız gerekiyor.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const supabase = getSupabase();
                      const { data: userData } = await supabase.auth.getUser();
                      if (!userData.user) return;

                      const returnUrl = encodeURIComponent("/app/jira");
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
              <div className="mb-6">
                <h1 className="mb-3 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                  Jira
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Projelerinizi ve issue'larınızı görüntüleyin
                </p>
              </div>

              {/* Tab Buttons */}
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <button
                  onClick={() => setActiveTab("projects")}
                  className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "projects"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Projeler
                </button>
                <button
                  onClick={() => setActiveTab("issues")}
                  className={`rounded-md px-6 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "issues"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  Issue'larım
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              {/* Projects Tab */}
              {activeTab === "projects" && (
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Projeler
                    </h2>
                    <button
                      onClick={fetchProjects}
                      disabled={projectsLoading}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      {projectsLoading ? "Yükleniyor..." : "Yenile"}
                    </button>
                  </div>

                  {projectsError && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      {projectsError}
                    </div>
                  )}

                  {projectsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                  ) : projects.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {projects.map((project) => (
                        <a
                          key={project.id}
                          href={`/app/jira/${project.location?.projectKey || project.id}`}
                          className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                        >
                          <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                            {project.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.location?.projectKey || project.location?.projectName}
                          </p>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      Proje bulunamadı
                    </div>
                  )}
                </div>
              )}

              {/* Issues Tab */}
              {activeTab === "issues" && (
                <div className="p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Issue'larım
                    </h2>
                    <button
                      onClick={fetchIssues}
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

                  {issuesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    </div>
                  ) : issues.length > 0 ? (
                    <div className="space-y-4">
                      {issues.map((issue) => (
                        <a
                          key={issue.id}
                          href={issue.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative block overflow-hidden rounded-xl border-2 border-l-4 border-l-blue-500 border-blue-400/15 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-500/30 hover:shadow-md dark:border-blue-500/10 dark:bg-gray-900 dark:hover:border-blue-500/20"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              {/* Header: Key, Status, Priority */}
                              <div className="mb-3 flex flex-wrap items-center gap-2">
                                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                                  {issue.key}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    issue.statusColor === "green"
                                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                      : issue.statusColor === "yellow"
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : issue.statusColor === "blue-gray"
                                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {issue.status}
                                </span>
                                {issue.priority && (
                                  <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                    {issue.priority}
                                  </span>
                                )}
                                {issue.type && (
                                  <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    {issue.type}
                                  </span>
                                )}
                              </div>

                              {/* Title */}
                              <h3 className="mb-2 text-base font-semibold leading-snug text-gray-900 dark:text-white">
                                {issue.summary}
                              </h3>

                              {/* Description */}
                              {issue.description && (
                                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                  {issue.description}
                                </p>
                              )}

                              {/* Footer: Metadata */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {issue.project.name}
                                </span>
                                {issue.assignee && (
                                  <div className="flex items-center gap-1.5">
                                    <svg
                                      className="h-3.5 w-3.5"
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
                                    <span>{issue.assignee.name}</span>
                                  </div>
                                )}
                                {issue.created && (
                                  <div className="flex items-center gap-1.5">
                                    <svg
                                      className="h-3.5 w-3.5"
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
                                    <span>
                                      {new Date(issue.created).toLocaleDateString("tr-TR", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* External Link Icon */}
                            <div className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
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
                                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                />
                              </svg>
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                      Issue bulunamadı
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </RequireAuth>
  );
}

