"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ExternalLink, History } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";
import JqlInput from "@/components/jira/JqlInput";
import Button from "@/components/ui/Button";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
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
  const router = useRouter();
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
      } catch {
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
    } catch {
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
    } catch {
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

      if (!response.ok) {
        let errorMessage = "Arama başarısız oldu.";
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

      if (data.issues) {
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
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  }, [jql, maxResults, jiraBaseUrl, showToast, saveToHistory]);


  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Jira Arama"
        description="JQL (Jira Query Language) ile gelişmiş arama yapın"
      />

      {/* Search Form */}
      <Card className="p-4 sm:p-5">
        <div className="space-y-4">
          {/* JQL Input */}
          <div>
            <label
              htmlFor="jql"
              className="mb-2 block text-sm font-medium text-card-foreground"
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
                className="mb-2 block text-sm font-medium text-card-foreground"
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
                className="w-full rounded-lg border-2 border-border bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:w-32"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowHistory(!showHistory)}
                icon={History}
              >
                {showHistory ? "Geçmişi Gizle" : "Geçmişi Göster"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => performSearch()}
                disabled={loading || !jql.trim()}
                loading={loading}
                icon={Search}
              >
                {loading ? "Aranıyor..." : "Ara"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Search Templates */}
      <Card className="p-4 sm:p-5">
        <h2 className="mb-4 text-lg font-semibold text-card-foreground">
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
              className="rounded-lg border-2 border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-primary/10 hover:text-primary"
            >
              {template.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Search History */}
      {showHistory && searchHistory.length > 0 && (
        <Card className="p-4 sm:p-5">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
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
                className="w-full rounded-lg border-2 border-border bg-muted/50 p-3 text-left transition-all duration-200 hover:border-primary hover:bg-primary/10"
              >
                <div className="mb-1 flex items-center justify-between">
                  <code className="text-xs font-mono text-card-foreground">
                    {item.jql}
                  </code>
                  <span className="text-xs text-muted-foreground">
                    {item.resultCount} sonuç
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleString("tr-TR")}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border-2 border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {loading && results.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse border-l-4 border-l-primary border-t-2 border-r-2 border-b-2 border-border bg-card p-3 shadow-sm sm:p-4"
            />
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-card-foreground">
              Sonuçlar
            </h2>
            <span className="text-sm text-muted-foreground">
              {results.length} / {totalResults} gösteriliyor
            </span>
          </div>
          <div className="space-y-3">
            {results.map((issue) => (
              <button
                key={issue.id}
                onClick={() => {
                  if (issue.key) {
                    router.push(`/app/jira/issues/${issue.key}`);
                  }
                }}
                disabled={!issue.key}
                className="group relative block w-full overflow-hidden rounded-lg border-l-4 border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-3 text-left shadow-md transition-all duration-300 hover:scale-[1.01] hover:border-border hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-md border-2 border-blue-300 bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700 shadow-sm dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        {issue.key}
                      </span>
                      <span
                        className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                          issue.statusColor
                        )}`}
                      >
                        {issue.status}
                      </span>
                      {issue.priority && (
                        <span className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold shadow-sm ${getPriorityColorClasses(issue.priority)}`}>
                          {issue.priority}
                        </span>
                      )}
                      <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {issue.type}
                      </span>
                    </div>
                    <h3 className="relative mb-2 text-base font-semibold text-card-foreground sm:text-lg">
                      {issue.summary}
                    </h3>
                    <div className="relative flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        <span className="font-medium">Proje:</span>{" "}
                        <span className="font-mono text-purple-600 dark:text-purple-400">
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
                  <ExternalLink className="h-5 w-5 shrink-0 text-purple-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100 dark:text-purple-400" />
                </div>
              </button>
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

