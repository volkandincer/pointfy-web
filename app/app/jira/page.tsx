"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Folder, ClipboardList, Pin, Search, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
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
      } catch {
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

      // Parse responses safely
      let projectsData: { boards?: JiraBoard[] } = {};
      let issuesData: { issues?: unknown[] } = {};

      if (projectsResponse.ok) {
        try {
          projectsData = await projectsResponse.json();
        } catch {
          // JSON parse failed, skip
        }
      }

      if (issuesResponse.ok) {
        try {
          issuesData = await issuesResponse.json();
        } catch {
          // JSON parse failed, skip
        }
      }

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
        setRecentIssues(issuesData.issues.slice(0, 10) as JiraTask[]);
      }
    } catch (err) {
      // Dashboard fetch error - silently fail for dashboard
      console.error("Dashboard fetch error:", err);
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
      <SectionHeader
        title="Dashboard"
        description="Jira projelerinizin ve issue'larınızın özeti"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Link
          href="/app/jira/projects"
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-center shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5"
        >
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110 sm:mb-3 sm:h-12 sm:w-12">
            <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="relative text-lg font-bold text-card-foreground sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-muted sm:h-8 sm:w-12" />
            ) : (
              projectsCount
            )}
          </div>
          <div className="relative text-[10px] font-medium text-muted-foreground sm:text-sm">
            Proje
          </div>
        </Link>

        <Link
          href="/app/jira/issues"
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 border-l-green-600 dark:border-l-green-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-center shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5"
        >
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-green-500/10 to-green-500/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500/20 to-transparent transition-transform group-hover:scale-110 sm:mb-3 sm:h-12 sm:w-12">
            <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400 sm:h-6 sm:w-6" />
          </div>
          <div className="relative text-lg font-bold text-card-foreground sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-muted sm:h-8 sm:w-12" />
            ) : (
              issuesCount
            )}
          </div>
          <div className="relative text-[10px] font-medium text-muted-foreground sm:text-sm">
            Issue
          </div>
        </Link>

        <Link
          href="/app/jira/boards"
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-center shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5"
        >
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110 sm:mb-3 sm:h-12 sm:w-12">
            <Pin className="h-5 w-5 text-purple-600 dark:text-purple-400 sm:h-6 sm:w-6" />
          </div>
          <div className="relative text-lg font-bold text-card-foreground sm:text-2xl">
            {loading ? (
              <span className="inline-block h-5 w-8 animate-pulse bg-muted sm:h-8 sm:w-12" />
            ) : (
              boardsCount
            )}
          </div>
          <div className="relative text-[10px] font-medium text-muted-foreground sm:text-sm">
            Board
          </div>
        </Link>

        <Link
          href="/app/jira/search"
          className="group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-l-4 border-l-orange-600 dark:border-l-orange-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-center shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-5"
        >
          <div className="absolute right-0 top-0 h-20 w-20 translate-x-4 -translate-y-4 rounded-full bg-gradient-to-br from-orange-500/10 to-orange-500/5 blur-xl transition-all group-hover:scale-150" />
          <div className="relative mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500/20 to-transparent transition-transform group-hover:scale-110 sm:mb-3 sm:h-12 sm:w-12">
            <Search className="h-5 w-5 text-orange-600 dark:text-orange-400 sm:h-6 sm:w-6" />
          </div>
          <div className="relative text-lg font-bold text-card-foreground sm:text-2xl">
            —
          </div>
          <div className="relative text-[10px] font-medium text-muted-foreground sm:text-sm">
            Arama
          </div>
        </Link>
      </div>

      {/* Recent Projects & Issues */}
      <div className="grid gap-4 lg:grid-cols-2 sm:gap-4">
        {/* Recent Projects */}
        <Card className="p-4 sm:p-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-card-foreground">
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
                  className="h-16 animate-pulse border-l-4 border-l-purple-400 border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4 dark:border-l-purple-500"
                />
              ))}
            </div>
          ) : recentProjects.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/app/jira/${
                    project.location?.projectKey || project.id
                  }`}
                  className="group block border-l-4 border-l-purple-600 border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm transition-all active:border-primary active:shadow-md sm:p-4 hover:border-primary hover:shadow-md dark:border-l-purple-500"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                      <Folder className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-card-foreground">
                        {project.name}
                      </h3>
                      <p className="truncate text-sm text-muted-foreground">
                        {project.location?.projectKey ||
                          project.location?.projectName}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
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
              <p className="text-sm font-medium text-muted-foreground">
                Proje bulunamadı
              </p>
            </div>
          )}
        </Card>

        {/* Recent Issues */}
        <Card className="p-4 sm:p-5">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20">
                <ClipboardList className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-lg font-bold text-card-foreground">
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
                  className="h-20 animate-pulse border-l-4 border-l-green-400 border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4 dark:border-l-green-500"
                />
              ))}
            </div>
          ) : recentIssues.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {recentIssues.map((issue) => (
                <a
                  key={issue.id}
                  href={issue.key ? `/app/jira/issues/${issue.key}` : issue.url}
                  className="group relative block overflow-hidden rounded-lg border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-border hover:shadow-xl sm:p-4"
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
                  <h3 className="line-clamp-2 text-sm font-semibold text-card-foreground">
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
              <p className="text-sm font-medium text-muted-foreground">
                Issue bulunamadı
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
