"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
import JqlInput from "@/components/jira/JqlInput";
import { getStatusColorClasses } from "@/lib/jira/colors";
import type { JiraTask } from "@/interfaces/Jira.interface";
import { getSupabase } from "@/lib/supabase";
import { useToastContext } from "@/contexts/ToastContext";

interface SearchHistoryItem {
  jql: string;
  timestamp: string;
  resultCount: number;
}

const QUICK_SEARCH_TEMPLATES = [
  { label: "Tüm açık issue'lar", jql: "status != Done AND status != Closed" },
  { label: "Bana atanan issue'lar", jql: "assignee = currentUser()" },
  { label: "Bug'lar", jql: "issuetype = Bug" },
  { label: "Yüksek öncelikli", jql: "priority in (Highest, High)" },
  { label: "Son 7 günde oluşturulan", jql: "created >= -7d" },
  { label: "Son 7 günde güncellenen", jql: "updated >= -7d" },
];

export default function JiraSearchPage() {
  const { showToast } = useToastContext();
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [jql, setJql] = useState<string>("");
  const [maxResults, setMaxResults] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<JiraTask[]>([]);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Load Jira base URL
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

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jira-search-history");
      if (stored) {
        const parsed = JSON.parse(stored) as SearchHistoryItem[];
        setSearchHistory(parsed.slice(0, 10)); // Max 10 items
      }
    } catch (err) {
      // Ignore localStorage errors
    }
  }, []);

  // Save search to history
  const saveToHistory = useCallback((jqlQuery: string, resultCount: number) => {
    try {
      const newItem: SearchHistoryItem = {
        jql: jqlQuery,
        timestamp: new Date().toISOString(),
        resultCount,
      };
      const updated = [newItem, ...searchHistory.filter((h) => h.jql !== jqlQuery)].slice(0, 10);
      setSearchHistory(updated);
      localStorage.setItem("jira-search-history", JSON.stringify(updated));
    } catch (err) {
      // Ignore localStorage errors
    }
  }, [searchHistory]);

  // Perform search
  const performSearch = useCallback(async (jqlQuery?: string) => {
    const queryToUse = jqlQuery || jql;
    
    if (!queryToUse.trim()) {
      showToast("Lütfen bir JQL sorgusu girin.", "error");
      return;
    }

    if (!jiraBaseUrl) {
      showToast("Jira bağlantısı bulunamadı. Lütfen ayarlardan kontrol edin.", "error");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        showToast("Lütfen giriş yapın.", "error");
        setLoading(false);
        return;
      }

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(`/api/jira/search?${urlParams.toString()}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jql: queryToUse.trim(),
          maxResults,
        }),
      });

      const data = await response.json();

      if (response.ok && data.issues) {
        setResults(data.issues);
        setTotalResults(data.total || data.issues.length);
        saveToHistory(queryToUse.trim(), data.total || data.issues.length);
        showToast(`${data.total || data.issues.length} sonuç bulundu.`, "success");
      } else {
        setError(data.error || "Arama başarısız oldu.");
        setResults([]);
        setTotalResults(0);
        showToast(data.error || "Arama başarısız oldu.", "error");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(errorMessage);
      setResults([]);
      setTotalResults(0);
      showToast("Arama sırasında bir hata oluştu.", "error");
    } finally {
      setLoading(false);
    }
  }, [jql, maxResults, jiraBaseUrl, showToast, saveToHistory]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
          Jira Arama
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          JQL (Jira Query Language) ile gelişmiş arama yapın
        </p>
      </div>

      {/* Search Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="space-y-4">
          {/* JQL Input */}
          <div>
            <label
              htmlFor="jql"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              JQL Sorgusu
            </label>
            <JqlInput
              value={jql}
              onChange={setJql}
              onSearch={performSearch}
              placeholder='örn: assignee = currentUser() AND status != Done'
              disabled={loading}
            />
          </div>

          {/* Max Results */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <label
                htmlFor="maxResults"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Maksimum Sonuç Sayısı
              </label>
              <input
                id="maxResults"
                type="number"
                min="1"
                max="100"
                value={maxResults}
                onChange={(e) => setMaxResults(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:w-32"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                {showHistory ? "Geçmişi Gizle" : "Geçmişi Göster"}
              </button>
              <button
                onClick={performSearch}
                disabled={loading || !jql.trim()}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:opacity-50"
              >
                {loading ? "Aranıyor..." : "Ara"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Search Templates */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Hızlı Arama Şablonları
        </h2>
        <div className="flex flex-wrap gap-3">
          {QUICK_SEARCH_TEMPLATES.map((template) => (
            <button
              key={template.label}
              onClick={() => {
                setJql(template.jql);
                performSearch(template.jql);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Arama Geçmişi
          </h2>
          <div className="space-y-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setJql(item.jql);
                  performSearch(item.jql);
                }}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20"
              >
                <div className="mb-1 flex items-center justify-between">
                  <code className="text-xs font-mono text-gray-700 dark:text-gray-300">
                    {item.jql}
                  </code>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.resultCount} sonuç
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleString("tr-TR")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && results.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Sonuçlar
            </h2>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {results.length} / {totalResults} gösteriliyor
            </span>
          </div>
          <div className="space-y-3">
            {results.map((issue) => (
              <a
                key={issue.id}
                href={issue.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-400 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-blue-600 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {issue.key}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${getStatusColorClasses(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                      {issue.priority && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {issue.priority}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {issue.type}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                      {issue.summary}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        <span className="font-medium">Proje:</span>{" "}
                        <span className="font-mono text-blue-600 dark:text-blue-400">
                          {issue.project.key}
                        </span>
                      </span>
                      {issue.assignee && (
                        <span>
                          <span className="font-medium">Atanan:</span> {issue.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="h-5 w-5 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100"
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
              </a>
            ))}
          </div>
        </div>
      ) : !loading && jql ? (
        <EmptyState
          icon={Search}
          title="Sonuç bulunamadı"
          description="Arama kriterlerinize uygun issue bulunamadı. JQL sorgunuzu kontrol edip tekrar deneyin."
        />
      ) : null}
    </div>
  );
}

