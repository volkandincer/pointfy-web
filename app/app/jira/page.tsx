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
          className="group rounded-xl border-2 border-blue-400/20 bg-white p-6 shadow-sm transition-all hover:border-blue-400/40 hover:shadow-md dark:border-blue-500/20 dark:bg-gray-900 dark:hover:border-blue-500/40"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm">
              <Folder className="h-6 w-6" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ) : (
              projectsCount
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Proje</div>
        </Link>

        <Link
          href="/app/jira/issues"
          className="group rounded-xl border-2 border-blue-400/20 bg-white p-6 shadow-sm transition-all hover:border-blue-400/40 hover:shadow-md dark:border-blue-500/20 dark:bg-gray-900 dark:hover:border-blue-500/40"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white shadow-sm">
              <ClipboardList className="h-6 w-6" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ) : (
              issuesCount
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Issue</div>
        </Link>

        <Link
          href="/app/jira/boards"
          className="group rounded-xl border-2 border-blue-400/20 bg-white p-6 shadow-sm transition-all hover:border-blue-400/40 hover:shadow-md dark:border-blue-500/20 dark:bg-gray-900 dark:hover:border-blue-500/40"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-sm">
              <Pin className="h-6 w-6" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {loading ? (
              <span className="inline-block h-8 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            ) : (
              boardsCount
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Board</div>
        </Link>

        <Link
          href="/app/jira/search"
          className="group rounded-xl border-2 border-blue-400/20 bg-white p-6 shadow-sm transition-all hover:border-blue-400/40 hover:shadow-md dark:border-blue-500/20 dark:bg-gray-900 dark:hover:border-blue-500/40"
        >
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-sm">
              <Search className="h-6 w-6" />
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            <Search className="mx-auto h-8 w-8 text-gray-400" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Arama</div>
        </Link>
      </div>

      {/* Recent Projects & Issues */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Projects */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Son Projeler
            </h2>
            <Link
              href="/app/jira/projects"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Tümünü Gör
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
            <div className="space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/jira/${project.location?.projectKey || project.id}`}
                  className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.location?.projectKey || project.location?.projectName}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Proje bulunamadı
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Son Issue&apos;lar
            </h2>
            <Link
              href="/app/jira/issues"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Tümünü Gör
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
            <div className="space-y-3">
              {recentIssues.map((issue) => (
                <a
                  key={issue.id}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg border border-gray-200 bg-gray-50 p-4 transition hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
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
                  <h3 className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">
                    {issue.summary}
                  </h3>
                </a>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Issue bulunamadı
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
