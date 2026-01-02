"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Search, ChevronRight } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import type { JiraBoard } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

export default function JiraProjectsPage() {
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");

  // Projects state
  const [projects, setProjects] = useState<JiraBoard[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<JiraBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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

  // Projects fetch
  const fetchProjects = useCallback(async () => {
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

      const response = await fetch(`/api/jira/boards?${urlParams.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        let errorMessage = "Failed to fetch projects";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // JSON parse failed, use status text
          errorMessage = `${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setProjects(data.boards || []);
      setFilteredProjects(data.boards || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }, [jiraBaseUrl]);

  useEffect(() => {
    if (jiraBaseUrl) {
      fetchProjects();
    }
  }, [jiraBaseUrl, fetchProjects]);

  // Search filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.location?.projectKey?.toLowerCase().includes(query) ||
        project.location?.projectName?.toLowerCase().includes(query)
    );
    setFilteredProjects(filtered);
  }, [searchQuery, projects]);


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <SectionHeader
        title="Projeler"
        description="Tüm Jira projelerinizi görüntüleyin ve yönetin"
        action={
          <button
            onClick={fetchProjects}
            disabled={loading}
            className="rounded-lg border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition-all duration-200 hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
          >
            {loading ? "Yükleniyor..." : "Yenile"}
          </button>
        }
      />

      {/* Search and View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 pl-10 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-base"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 rounded-lg border-2 border-border bg-card p-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
              viewMode === "grid"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md px-3 py-1.5 text-sm transition-all duration-200 ${
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Projects Content */}
      {loading && projects.length === 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-32 animate-pulse border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4 ${
                viewMode === "list" ? "w-full" : ""
              }`}
            />
          ))}
        </div>
      ) : filteredProjects.length > 0 ? (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/app/jira/${project.location?.projectKey || project.id}`}
                className="group relative block overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl sm:p-4"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
                <div className="relative mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110">
                    <Folder className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="relative mb-2 text-lg font-semibold text-card-foreground">
                  {project.name}
                </h3>
                <div className="relative space-y-1">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Key:</span>{" "}
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {project.location?.projectKey || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Tip:</span>{" "}
                    <span className="capitalize">{project.type || "scrum"}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredProjects.map((project) => (
              <Link
                key={project.id}
                href={`/app/jira/${project.location?.projectKey || project.id}`}
                className="group relative block overflow-hidden rounded-lg border-l-4 border-l-purple-600 dark:border-l-purple-500 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-border hover:shadow-xl sm:p-4"
              >
                <div className="absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br from-purple-500/10 to-purple-500/5 blur-xl transition-all group-hover:scale-150" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500/20 to-transparent transition-transform group-hover:scale-110">
                      <Folder className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="relative mb-1 text-lg font-semibold text-card-foreground">
                        {project.name}
                      </h3>
                      <div className="relative flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          <span className="font-medium">Key:</span>{" "}
                          <span className="font-mono text-purple-600 dark:text-purple-400">
                            {project.location?.projectKey || "N/A"}
                          </span>
                        </span>
                        <span>
                          <span className="font-medium">Tip:</span>{" "}
                          <span className="capitalize">{project.type || "scrum"}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <EmptyState
          icon={searchQuery ? Search : Folder}
          title={searchQuery ? "Proje bulunamadı" : "Henüz proje yok"}
          description={
            searchQuery
              ? "Arama kriterlerinize uygun proje bulunamadı. Farklı bir arama terimi deneyin."
              : "Jira hesabınızda henüz proje bulunmuyor. Projeler oluşturulduğunda burada görünecektir."
          }
        />
      )}

      {/* Results Count */}
      {filteredProjects.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          {filteredProjects.length} proje gösteriliyor
          {searchQuery && projects.length !== filteredProjects.length && (
            <span> (toplam {projects.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

