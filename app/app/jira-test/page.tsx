"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { JiraBoard, JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";

type TabType = "boards" | "issues" | "projects" | "myself" | "search" | "test" | "settings";

export default function JiraTestPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => [
      ...getDefaultNavigationItems(),
      { label: "Jira Test", href: "/app/jira-test" },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<TabType>("boards");
  const [jiraConnected, setJiraConnected] = useState<boolean>(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Boards state
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [boardsLoading, setBoardsLoading] = useState<boolean>(false);
  const [boardsError, setBoardsError] = useState<string | null>(null);
  const [boardsResponse, setBoardsResponse] = useState<any>(null);

  // Issues state
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [issuesLoading, setIssuesLoading] = useState<boolean>(false);
  const [issuesError, setIssuesError] = useState<string | null>(null);
  const [issuesResponse, setIssuesResponse] = useState<any>(null);

  // Test state
  const [testLoading, setTestLoading] = useState<boolean>(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [testResponse, setTestResponse] = useState<any>(null);

  // Projects state
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState<boolean>(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectsResponse, setProjectsResponse] = useState<any>(null);

  // Myself state
  const [myself, setMyself] = useState<any>(null);
  const [myselfLoading, setMyselfLoading] = useState<boolean>(false);
  const [myselfError, setMyselfError] = useState<string | null>(null);
  const [myselfResponse, setMyselfResponse] = useState<any>(null);

  // Search state
  const [searchResults, setSearchResults] = useState<JiraTask[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResponse, setSearchResponse] = useState<any>(null);
  const [searchJql, setSearchJql] = useState<string>("assignee=currentuser()");
  const [searchMaxResults, setSearchMaxResults] = useState<number>(50);

  // Settings state
  const [jiraBaseUrlInput, setJiraBaseUrlInput] = useState<string>("");
  const [savingUrl, setSavingUrl] = useState<boolean>(false);

  // Jira bağlantı durumunu kontrol et
  useEffect(() => {
    let mounted = true;
    async function checkJiraConnection() {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted || !userData.user) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("jira_access_token, jira_base_url")
          .eq("id", userData.user.id)
          .maybeSingle();

        if (mounted) {
          setJiraConnected(!!userRow?.jira_access_token);
          if (userRow?.jira_base_url) {
            setJiraBaseUrl(userRow.jira_base_url);
            setJiraBaseUrlInput(userRow.jira_base_url);
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

  // Boards fetch
  const fetchBoards = useCallback(async () => {
    if (!jiraBaseUrl) {
      setBoardsError("Jira URL'i bulunamadı.");
      return;
    }

    setBoardsLoading(true);
    setBoardsError(null);

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
      setBoardsResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch boards");
      }

      setBoards(data.boards || []);
    } catch (err) {
      console.error("Fetch boards error:", err);
      setBoardsError(err instanceof Error ? err.message : "Failed to load boards");
    } finally {
      setBoardsLoading(false);
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
      setIssuesResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch issues");
      }

      setIssues(data.issues || []);
    } catch (err) {
      console.error("Fetch issues error:", err);
      setIssuesError(err instanceof Error ? err.message : "Failed to load issues");
    } finally {
      setIssuesLoading(false);
    }
  }, [jiraBaseUrl]);

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
      setProjectsResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

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

  // Myself fetch
  const fetchMyself = useCallback(async () => {
    if (!jiraBaseUrl) {
      setMyselfError("Jira URL'i bulunamadı.");
      return;
    }

    setMyselfLoading(true);
    setMyselfError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/myself?${urlParams.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();
      setMyselfResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch user info");
      }

      setMyself(data);
    } catch (err) {
      console.error("Fetch myself error:", err);
      setMyselfError(err instanceof Error ? err.message : "Failed to load user info");
    } finally {
      setMyselfLoading(false);
    }
  }, [jiraBaseUrl]);

  // Search fetch
  const fetchSearch = useCallback(async () => {
    if (!jiraBaseUrl || !searchJql.trim()) {
      setSearchError("Jira URL'i veya JQL sorgusu bulunamadı.");
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/search?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jql: searchJql,
          maxResults: searchMaxResults,
        }),
      });

      const data = await response.json();
      setSearchResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to search");
      }

      // Helper function: ADF format description'ı string'e çevir
      const extractDescription = (desc: any): string | undefined => {
        if (!desc) return undefined;
        if (typeof desc === "string") return desc;
        if (typeof desc === "object" && desc.content) {
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

      // Issues'ları JiraTask formatına çevir
      const tasks: JiraTask[] = (data.issues || []).map((issue: any) => ({
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
          key: issue.fields?.project?.key || "",
          name: issue.fields?.project?.name || "",
        },
        created: issue.fields?.created || "",
        updated: issue.fields?.updated || "",
        resolved: issue.fields?.resolutiondate,
        url: jiraBaseUrl
          ? `https://${jiraBaseUrl}/browse/${issue.key}`
          : `https://${jiraBaseUrl}/browse/${issue.key}`,
      }));

      setSearchResults(tasks);
    } catch (err) {
      console.error("Search error:", err);
      setSearchError(err instanceof Error ? err.message : "Failed to search");
    } finally {
      setSearchLoading(false);
    }
  }, [jiraBaseUrl, searchJql, searchMaxResults]);

  // Test connection
  const testConnection = useCallback(async () => {
    if (!jiraBaseUrl) {
      setTestError("Jira URL'i bulunamadı.");
      return;
    }

    setTestLoading(true);
    setTestError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/test-connection?${urlParams.toString()}`, {
        credentials: "include",
      });

      const data = await response.json();
      setTestResponse({
        status: response.status,
        ok: response.ok,
        ...data,
      });

      if (!response.ok) {
        throw new Error(data.error || "Failed to test connection");
      }
    } catch (err) {
      console.error("Test connection error:", err);
      setTestError(err instanceof Error ? err.message : "Failed to test connection");
    } finally {
      setTestLoading(false);
    }
  }, [jiraBaseUrl]);

  // Save URL
  const handleSaveUrl = useCallback(async () => {
    if (!jiraBaseUrlInput.trim()) {
      return;
    }

    setSavingUrl(true);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        throw new Error("Please log in first");
      }

      let normalizedUrl = jiraBaseUrlInput.trim();
      if (normalizedUrl.startsWith("http://") || normalizedUrl.startsWith("https://")) {
        normalizedUrl = normalizedUrl.replace(/^https?:\/\//, "");
      }
      if (normalizedUrl.endsWith("/")) {
        normalizedUrl = normalizedUrl.slice(0, -1);
      }

      const response = await fetch(
        `/api/jira/save-url?userId=${encodeURIComponent(userData.user.id)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ jiraBaseUrl: normalizedUrl }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save Jira URL");
      }

      setJiraBaseUrl(normalizedUrl);
    } catch (err) {
      console.error("Save URL error:", err);
    } finally {
      setSavingUrl(false);
    }
  }, [jiraBaseUrlInput]);

  // Tab değiştiğinde ilgili datayı yükle
  useEffect(() => {
    if (!jiraConnected || !jiraBaseUrl) return;

    if (activeTab === "boards") {
      fetchBoards();
    } else if (activeTab === "issues") {
      fetchIssues();
    } else if (activeTab === "projects") {
      fetchProjects();
    } else if (activeTab === "myself") {
      fetchMyself();
    }
    // Search tab'ı manuel olarak tetiklenir (buton ile)
  }, [activeTab, jiraConnected, jiraBaseUrl, fetchBoards, fetchIssues, fetchProjects, fetchMyself]);

  if (loading) {
    return (
      <RequireAuth>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
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
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-2xl border border-yellow-200/70 bg-yellow-50/50 p-6 shadow-sm dark:border-yellow-800/70 dark:bg-yellow-900/10">
              <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                Jira Bağlantısı Gerekli
              </h2>
              <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                Jira servislerini test etmek için Jira hesabınızı bağlamanız gerekiyor.
              </p>
              <button
                onClick={async () => {
                  try {
                    const supabase = getSupabase();
                    const { data: userData } = await supabase.auth.getUser();
                    if (!userData.user) return;

                    const returnUrl = encodeURIComponent("/app/jira-test");
                    const encodedUserId = encodeURIComponent(userData.user.id);
                    window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                  } catch (err) {
                    console.error("Jira OAuth error:", err);
                  }
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Connect Jira
              </button>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </RequireAuth>
    );
  }

  const tabs: Array<{ id: TabType; label: string }> = [
    { id: "boards", label: "Boards" },
    { id: "issues", label: "Issues" },
    { id: "projects", label: "Projects" },
    { id: "myself", label: "Myself" },
    { id: "search", label: "Search" },
    { id: "test", label: "Test Connection" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <RequireAuth>
      <Header navigationItems={navigationItems} />
      <main className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Jira Test Dashboard
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Jira servislerini test edin ve dataları görüntüleyin
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            {/* Boards Tab */}
            {activeTab === "boards" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Boards
                  </h2>
                  <button
                    onClick={fetchBoards}
                    disabled={boardsLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {boardsLoading ? "Yükleniyor..." : "Yenile"}
                  </button>
                </div>

                {boardsError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <div className="font-semibold mb-1">{boardsError.split("\n")[0]}</div>
                    {(boardsError.includes("token expired") ||
                      boardsError.includes("token invalid") ||
                      boardsError.includes("Token geçersiz") ||
                      boardsError.includes("süresi dolmuş") ||
                      boardsError.includes("401")) && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            try {
                              const supabase = getSupabase();
                              const { data: userData } = await supabase.auth.getUser();
                              if (!userData.user) return;

                              const returnUrl = encodeURIComponent("/app/jira-test");
                              const encodedUserId = encodeURIComponent(userData.user.id);
                              window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                            } catch (err) {
                              console.error("Jira OAuth error:", err);
                            }
                          }}
                          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          🔄 Jira'yı Yeniden Bağla
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {boardsResponse && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 API Response (Status: {boardsResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(boardsResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {boardsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : boards.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {boards.map((board) => (
                      <div
                        key={board.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {board.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {board.type} - {board.location.projectName}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Board bulunamadı
                  </div>
                )}
              </div>
            )}

            {/* Issues Tab */}
            {activeTab === "issues" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Issues
                  </h2>
                  <button
                    onClick={fetchIssues}
                    disabled={issuesLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {issuesLoading ? "Yükleniyor..." : "Yenile"}
                  </button>
                </div>

                {issuesError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    <div className="font-semibold mb-1">{issuesError.split("\n")[0]}</div>
                    {(issuesError.includes("token expired") ||
                      issuesError.includes("token invalid") ||
                      issuesError.includes("Token geçersiz") ||
                      issuesError.includes("süresi dolmuş") ||
                      issuesError.includes("401")) && (
                      <div className="mt-3">
                        <button
                          onClick={async () => {
                            try {
                              const supabase = getSupabase();
                              const { data: userData } = await supabase.auth.getUser();
                              if (!userData.user) return;

                              const returnUrl = encodeURIComponent("/app/jira-test");
                              const encodedUserId = encodeURIComponent(userData.user.id);
                              window.location.href = `/api/auth/jira?returnUrl=${returnUrl}&userId=${encodedUserId}`;
                            } catch (err) {
                              console.error("Jira OAuth error:", err);
                            }
                          }}
                          className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          🔄 Jira'yı Yeniden Bağla
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {issuesResponse && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 API Response (Status: {issuesResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(issuesResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {issuesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : issues.length > 0 ? (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <a
                        key={issue.id}
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {issue.key}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  issue.statusColor === "green"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : issue.statusColor === "yellow"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {issue.status}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {issue.summary}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {issue.project.name}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Issue bulunamadı
                  </div>
                )}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Projects
                  </h2>
                  <button
                    onClick={fetchProjects}
                    disabled={projectsLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {projectsLoading ? "Yükleniyor..." : "Yenile"}
                  </button>
                </div>

                {projectsError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {projectsError}
                  </div>
                )}

                {projectsResponse && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 API Response (Status: {projectsResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(projectsResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : projects.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project: any) => (
                      <div
                        key={project.id}
                        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {project.name}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                          {project.type} - {project.location?.projectName || project.location?.projectKey}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Proje bulunamadı
                  </div>
                )}
              </div>
            )}

            {/* Myself Tab */}
            {activeTab === "myself" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    My User Info
                  </h2>
                  <button
                    onClick={fetchMyself}
                    disabled={myselfLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {myselfLoading ? "Yükleniyor..." : "Yenile"}
                  </button>
                </div>

                {myselfError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {myselfError}
                  </div>
                )}

                {myselfResponse && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 API Response (Status: {myselfResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(myselfResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {myselfLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : myself ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                        Account Information
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Account ID:</span>{" "}
                          <span className="text-gray-900 dark:text-white">{myself.accountId}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Display Name:</span>{" "}
                          <span className="text-gray-900 dark:text-white">{myself.displayName}</span>
                        </div>
                        {myself.emailAddress && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Email:</span>{" "}
                            <span className="text-gray-900 dark:text-white">{myself.emailAddress}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-400">Active:</span>{" "}
                          <span className={myself.active ? "text-green-600" : "text-red-600"}>
                            {myself.active ? "Yes" : "No"}
                          </span>
                        </div>
                        {myself.timeZone && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-400">Time Zone:</span>{" "}
                            <span className="text-gray-900 dark:text-white">{myself.timeZone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {myself.avatarUrls && (
                      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Avatar</h3>
                        <img
                          src={myself.avatarUrls["48x48"]}
                          alt={myself.displayName}
                          className="h-12 w-12 rounded-full"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Kullanıcı bilgileri yüklenmedi
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === "search" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    JQL Search
                  </h2>
                  <button
                    onClick={fetchSearch}
                    disabled={searchLoading || !searchJql.trim()}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {searchLoading ? "Aranıyor..." : "Ara"}
                  </button>
                </div>

                <div className="mb-4 space-y-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      JQL Query
                    </label>
                    <textarea
                      value={searchJql}
                      onChange={(e) => setSearchJql(e.target.value)}
                      placeholder="assignee=currentuser()"
                      rows={3}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Örnek: assignee=currentuser(), project=SCRUM, status!=Done
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Max Results
                    </label>
                    <input
                      type="number"
                      value={searchMaxResults}
                      onChange={(e) => setSearchMaxResults(parseInt(e.target.value) || 50)}
                      min={1}
                      max={100}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>

                {searchError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {searchError}
                  </div>
                )}

                {searchResponse && (
                  <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 API Response (Status: {searchResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(searchResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {searchResults.length} sonuç bulundu
                    </div>
                    {searchResults.map((issue) => (
                      <a
                        key={issue.id}
                        href={issue.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {issue.key}
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                  issue.statusColor === "green"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                    : issue.statusColor === "yellow"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                {issue.status}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {issue.summary}
                            </h3>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                              {issue.project.name}
                            </p>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                ) : searchResponse && searchResults.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Sonuç bulunamadı
                  </div>
                ) : (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Arama yapmak için JQL sorgusu girin ve "Ara" butonuna tıklayın
                  </div>
                )}
              </div>
            )}

            {/* Test Tab */}
            {activeTab === "test" && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Test Connection
                  </h2>
                  <button
                    onClick={testConnection}
                    disabled={testLoading}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  >
                    {testLoading ? "Test Ediliyor..." : "Test Et"}
                  </button>
                </div>

                {testError && (
                  <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {testError}
                  </div>
                )}

                {testResponse && (
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-semibold text-blue-900 dark:text-blue-300">
                        📡 Test Response (Status: {testResponse.status})
                      </h3>
                    </div>
                    <pre className="overflow-x-auto rounded bg-white p-3 text-xs dark:bg-gray-800">
                      {JSON.stringify(testResponse, null, 2)}
                    </pre>
                  </div>
                )}

                {!testResponse && !testLoading && (
                  <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Test etmek için "Test Et" butonuna tıklayın
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Settings
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Jira Base URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={jiraBaseUrlInput}
                        onChange={(e) => setJiraBaseUrlInput(e.target.value)}
                        placeholder="pointf.atlassian.net"
                        className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        onClick={handleSaveUrl}
                        disabled={!jiraBaseUrlInput.trim() || savingUrl}
                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingUrl ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </div>
                    {jiraBaseUrl && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Mevcut URL: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{jiraBaseUrl}</code>
                      </p>
                    )}
                  </div>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                    <h3 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                      Connection Status
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-3 w-3 rounded-full ${
                          jiraConnected
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {jiraConnected ? "Connected" : "Not Connected"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer navigationItems={navigationItems} />
    </RequireAuth>
  );
}

