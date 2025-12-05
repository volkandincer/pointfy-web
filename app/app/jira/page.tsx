"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Folder, ClipboardList, Pin, Search, ChevronRight } from "lucide-react";
import type { JiraBoard, JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

export default function JiraDashboardPage() {
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Stats state
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [boardsCount, setBoardsCount] = useState<number>(0);
  const [issuesCount, setIssuesCount] = useState<number>(0);
  const [recentProjects, setRecentProjects] = useState<JiraBoard[]>([]);
  const [recentIssues, setRecentIssues] = useState<JiraTask[]>([]);

  // Jira base URL'i al (layout'ta connection check yapılıyor)
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

  // Dashboard verilerini yükle
  const fetchDashboardData = useCallback(async () => {
    if (!jiraBaseUrl) return;

    setLoading(true);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      // Projects, Boards ve Issues'i paralel olarak yükle
      const [projectsResponse, issuesResponse] = await Promise.all([
        fetch(`/api/jira/boards?${urlParams.toString()}`, {
          credentials: "include",
        }),
        fetch(`/api/jira/issues?${urlParams.toString()}`, {
          credentials: "include",
        }),
      ]);

      const projectsData = await projectsResponse.json();
      const issuesData = await issuesResponse.json();

      if (projectsResponse.ok && projectsData.boards) {
        const boards = projectsData.boards || [];
        const uniqueProjects = new Set(
          boards.map((b: JiraBoard) => b.location?.projectKey).filter(Boolean)
        );
        setProjectsCount(uniqueProjects.size);
        setBoardsCount(boards.length);
        setRecentProjects(boards.slice(0, 5));
      }

      if (issuesResponse.ok && issuesData.issues) {
        setIssuesCount(issuesData.issues.length);
        setRecentIssues(issuesData.issues.slice(0, 10));
      }
    } catch (err) {
      // Dashboard fetch error
    } finally {
      setLoading(false);
    }
  }, [jiraBaseUrl]);

  useEffect(() => {
    if (jiraBaseUrl) {
      fetchDashboardData();
    }
  }, [jiraBaseUrl, fetchDashboardData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Jira projelerinizin ve issue&apos;larınızın özeti
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/app/jira/projects"
          className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-700/70"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 blur-2xl transition-all group-hover:scale-150" />
          <div className="relative mb-4 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
              <Folder className="h-7 w-7" />
            </div>
            <ChevronRight className="h-5 w-5 text-blue-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <div className="mb-1 text-4xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <span className="inline-block h-10 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                projectsCount
              )}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Proje</div>
          </div>
        </Link>

        <Link
          href="/app/jira/issues"
          className="group relative overflow-hidden rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-green-300/70 hover:shadow-xl dark:border-green-800/50 dark:from-green-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-green-700/70"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 blur-2xl transition-all group-hover:scale-150" />
          <div className="relative mb-4 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-green-500/40">
              <ClipboardList className="h-7 w-7" />
            </div>
            <ChevronRight className="h-5 w-5 text-green-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <div className="mb-1 text-4xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <span className="inline-block h-10 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                issuesCount
              )}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Issue</div>
          </div>
        </Link>

        <Link
          href="/app/jira/boards"
          className="group relative overflow-hidden rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-purple-300/70 hover:shadow-xl dark:border-purple-800/50 dark:from-purple-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-purple-700/70"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-purple-400/20 to-purple-600/20 blur-2xl transition-all group-hover:scale-150" />
          <div className="relative mb-4 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-purple-500/40">
              <Pin className="h-7 w-7" />
            </div>
            <ChevronRight className="h-5 w-5 text-purple-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <div className="mb-1 text-4xl font-bold text-gray-900 dark:text-white">
              {loading ? (
                <span className="inline-block h-10 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                boardsCount
              )}
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Board</div>
          </div>
        </Link>

        <Link
          href="/app/jira/search"
          className="group relative overflow-hidden rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-orange-300/70 hover:shadow-xl dark:border-orange-800/50 dark:from-orange-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-orange-700/70"
        >
          <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/20 blur-2xl transition-all group-hover:scale-150" />
          <div className="relative mb-4 flex items-center justify-between">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-orange-500/40">
              <Search className="h-7 w-7" />
            </div>
            <ChevronRight className="h-5 w-5 text-orange-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
          </div>
          <div className="relative">
            <div className="mb-1 flex items-center justify-center text-4xl font-bold text-gray-900 dark:text-white">
              <Search className="h-10 w-10 text-orange-400" />
            </div>
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Arama</div>
          </div>
        </Link>
      </div>

      {/* Recent Projects & Issues */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-lg dark:border-gray-800/70 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md">
                <Folder className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Son Projeler
              </h2>
            </div>
            <Link
              href="/app/jira/projects"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Tümünü Gör →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-2.5">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/jira/${project.location?.projectKey || project.id}`}
                  className="group block rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-all hover:border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-50/50 hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 dark:hover:border-blue-600 dark:hover:from-blue-900/20 dark:hover:to-blue-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm transition-transform group-hover:scale-110">
                      <Folder className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                        {project.location?.projectKey || project.location?.projectName}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-gray-400 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10">
                  <Folder className="h-8 w-8 text-blue-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Proje bulunamadı
              </p>
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="rounded-2xl border border-gray-200/70 bg-white p-6 shadow-lg dark:border-gray-800/70 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md">
                <ClipboardList className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Son Issue&apos;lar
              </h2>
            </div>
            <Link
              href="/app/jira/issues"
              className="text-sm font-semibold text-green-600 transition-colors hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
            >
              Tümünü Gör →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
          ) : recentIssues.length > 0 ? (
            <div className="space-y-2.5">
              {recentIssues.map((issue) => (
                <a
                  key={issue.id}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-all hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-50/50 hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 dark:hover:border-green-600 dark:hover:from-green-900/20 dark:hover:to-green-900/10"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
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
                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {issue.summary}
                  </h3>
                </a>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="mb-3 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/10">
                  <ClipboardList className="h-8 w-8 text-green-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Issue bulunamadı
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
