"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Folder, ClipboardList, Pin, Search, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { getStatusColorClasses } from "@/lib/jira/colors";
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
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
          Dashboard
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Jira projelerinizin ve issue&apos;larınızın özeti
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4">
        <Link
          href="/app/jira/projects"
          className="flex flex-col items-center justify-center border-2 border-gray-300 bg-white p-2 text-center shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20 sm:mb-3 sm:h-12 sm:w-12">
            <Folder className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-12" />
            ) : (
              projectsCount
            )}
          </div>
          <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Proje</div>
        </Link>

        <Link
          href="/app/jira/issues"
          className="flex flex-col items-center justify-center border-2 border-gray-300 bg-white p-2 text-center shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20 sm:mb-3 sm:h-12 sm:w-12">
            <ClipboardList className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-12" />
            ) : (
              issuesCount
            )}
          </div>
          <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Issue</div>
        </Link>

        <Link
          href="/app/jira/boards"
          className="flex flex-col items-center justify-center border-2 border-gray-300 bg-white p-2 text-center shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 sm:mb-3 sm:h-12 sm:w-12">
            <Pin className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-6 sm:w-6" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-gray-200 dark:bg-gray-800 sm:h-8 sm:w-12" />
            ) : (
              boardsCount
            )}
          </div>
          <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Board</div>
        </Link>

        <Link
          href="/app/jira/search"
          className="flex flex-col items-center justify-center border-2 border-gray-300 bg-white p-2 text-center shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-5 hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20 sm:mb-3 sm:h-12 sm:w-12">
            <Search className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-6 sm:w-6" />
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-2xl">—</div>
          <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Arama</div>
        </Link>
      </div>

      {/* Recent Projects & Issues */}
      <div className="grid gap-4 lg:grid-cols-2 sm:gap-4">
        {/* Recent Projects */}
        <div className="border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Son Projeler
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              href="/app/jira/projects"
              asLink
              showArrow
              className="border-purple-600 text-purple-600 hover:border-purple-700 hover:bg-purple-50 hover:text-purple-700 dark:border-purple-500 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              Tümünü Gör
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse border-l-4 border-l-purple-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900"
                />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/jira/${project.location?.projectKey || project.id}`}
                  className="group block border-l-4 border-l-purple-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                      <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                <div className="flex h-16 w-16 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                  <Folder className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Proje bulunamadı
              </p>
            </div>
          )}
        </div>

        {/* Recent Issues */}
        <div className="border-2 border-gray-300 bg-white p-4 shadow-sm sm:p-5 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20">
                <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Son Issue&apos;lar
              </h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              href="/app/jira/issues"
              asLink
              showArrow
              className="border-green-600 text-green-600 hover:border-green-700 hover:bg-green-50 hover:text-green-700 dark:border-green-500 dark:text-green-400 dark:hover:bg-green-900/20"
            >
              Tümünü Gör
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse border-l-4 border-l-green-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900"
                />
              ))}
            </div>
          ) : recentIssues.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentIssues.map((issue) => (
                <a
                  key={issue.id}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block border-l-4 border-l-green-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-green-500 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md border-2 border-blue-300 bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold ${getStatusColorClasses(
                        issue.statusColor
                      )}`}
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
                <div className="flex h-16 w-16 items-center justify-center rounded-md border-2 border-green-600 bg-green-50 dark:bg-green-900/20">
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
