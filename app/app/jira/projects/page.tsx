"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Folder, Search, ChevronRight } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
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
    } catch {
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Projeler
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
            Tüm Jira projelerinizi görüntüleyin ve yönetin
          </p>
        </div>
        <button
          onClick={fetchProjects}
          disabled={loading}
          className="rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Proje ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-500 focus:border-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-purple-500 sm:text-base"
          />
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        </div>
        <div className="flex items-center gap-2 rounded-md border-2 border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === "grid"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            Grid
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-md px-3 py-1.5 text-sm transition ${
              viewMode === "list"
                ? "bg-purple-600 text-white"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md border-2 border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Projects Content */}
      {loading && projects.length === 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4" : "space-y-3 sm:space-y-4"}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={`h-32 animate-pulse border-l-4 border-l-purple-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900 ${
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
                className="group block border-l-4 border-l-purple-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                    <Folder className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {project.name}
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Key:</span>{" "}
                    <span className="font-mono text-purple-600 dark:text-purple-400">
                      {project.location?.projectKey || "N/A"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
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
                className="group block border-l-4 border-l-purple-600 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:border-l-purple-500 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20">
                      <Folder className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                  <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
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
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          {filteredProjects.length} proje gösteriliyor
          {searchQuery && projects.length !== filteredProjects.length && (
            <span> (toplam {projects.length})</span>
          )}
        </div>
      )}
    </div>
  );
}

