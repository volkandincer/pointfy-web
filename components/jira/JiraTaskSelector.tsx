"use client";

import { memo, useCallback, useEffect, useState, useMemo } from "react";
import { Search, ClipboardList } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import type { JiraBoard, JiraTask, JiraAdfDocument, JiraAdfNode } from "@/interfaces/Jira.interface";
import type { JiraTaskSelectorProps } from "@/interfaces/JiraTaskSelection.interface";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import FilterDropdown from "@/components/jira/FilterDropdown";
import EmptyState from "@/components/jira/EmptyState";

const JiraTaskSelector = memo(function JiraTaskSelector({
  onTaskSelect,
  onCancel,
  jiraBaseUrl,
}: JiraTaskSelectorProps) {
  const [boards, setBoards] = useState<JiraBoard[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null);
  const [selectedProjectKey, setSelectedProjectKey] = useState<string | null>(null);
  const [issues, setIssues] = useState<JiraTask[]>([]);
  const [loadingBoards, setLoadingBoards] = useState<boolean>(false);
  const [loadingIssues, setLoadingIssues] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // LocalStorage key for last selected board
  const STORAGE_KEY = `jira_last_board_${jiraBaseUrl || "default"}`;

  // ADF description'ı string'e çevir
  const extractDescription = useCallback((
    desc: JiraAdfDocument | string | undefined | { type?: string; version?: number; content?: unknown }
  ): string | undefined => {
    if (!desc) return undefined;
    if (typeof desc === "string") return desc;
    if (typeof desc !== "object") return undefined;

    const extractText = (node: JiraAdfNode | unknown): string => {
      if (typeof node === "string") return node;
      if (typeof node !== "object" || !node) return "";
      
      const adfNode = node as JiraAdfNode;
      const currentText = adfNode.text ?? "";
      if (adfNode.content && Array.isArray(adfNode.content)) {
        return currentText + adfNode.content.map(extractText).join("");
      }
      return currentText;
    };

    const doc = desc as JiraAdfDocument;
    if (Array.isArray(doc.content)) {
      const combined = doc.content.map(extractText).join("").trim();
      return combined || undefined;
    }

    return undefined;
  }, []);

  // Board'ları yükle
  useEffect(() => {
    let mounted = true;

    async function fetchBoards() {
      if (!jiraBaseUrl) {
        setError("Jira URL'i bulunamadı.");
        return;
      }

      setLoadingBoards(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          if (mounted) setLoadingBoards(false);
          return;
        }

        const urlParams = new URLSearchParams();
        urlParams.set("jiraBaseUrl", jiraBaseUrl);
        urlParams.set("userId", userData.user.id);

        const response = await fetch(`/api/jira/boards?${urlParams.toString()}`, {
          credentials: "include",
        });

        const data = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(data.error || "Board'lar yüklenemedi");
        }

        const boardsData = data.boards || [];
        setBoards(boardsData);

        // Son seçilen board'u yükle (eğer varsa)
        if (mounted && boardsData.length > 0) {
          try {
            const lastBoardId = localStorage.getItem(STORAGE_KEY);
            if (lastBoardId) {
              const boardIdNum = Number(lastBoardId);
              const lastBoard = boardsData.find((b: JiraBoard) => b.id === boardIdNum);
              if (lastBoard) {
                setSelectedBoardId(boardIdNum);
                setSelectedProjectKey(lastBoard.location.projectKey);
              }
            }
          } catch (storageError) {
            // LocalStorage read error
          }
        }
      } catch (err) {
        if (!mounted) return;
        // Fetch boards error
        setError(err instanceof Error ? err.message : "Board'lar yüklenemedi");
      } finally {
        if (mounted) setLoadingBoards(false);
      }
    }

    fetchBoards();

    return () => {
      mounted = false;
    };
  }, [jiraBaseUrl, STORAGE_KEY]);

  // Seçilen board'un issue'larını yükle (projectKey kullanarak - Agile API gerektirmez)
  useEffect(() => {
    let mounted = true;

    async function fetchIssues() {
      if (!selectedProjectKey || !jiraBaseUrl) {
        console.log("JiraTaskSelector: Missing projectKey or jiraBaseUrl", {
          selectedProjectKey,
          jiraBaseUrl,
          selectedBoardId,
        });
        setIssues([]);
        setError(null);
        return;
      }

      setLoadingIssues(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();

        if (!mounted || !userData.user) {
          if (mounted) setLoadingIssues(false);
          return;
        }

        // Project key ile issue'ları çek (Agile API yerine REST API v3 kullan)
        const urlParams = new URLSearchParams();
        urlParams.set("jiraBaseUrl", jiraBaseUrl);
        urlParams.set("userId", userData.user.id);
        urlParams.set("jql", `project=${selectedProjectKey}`);

        const apiUrl = `/api/jira/search?${urlParams.toString()}`;
        console.log("JiraTaskSelector: Fetching issues", {
          apiUrl,
          projectKey: selectedProjectKey,
          jql: `project=${selectedProjectKey}`,
        });

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            jql: `project=${selectedProjectKey}`,
            maxResults: 100,
          }),
        });

        const data = await response.json();

        if (!mounted) return;

        console.log("JiraTaskSelector: API Response", {
          ok: response.ok,
          status: response.status,
          dataKeys: Object.keys(data),
          issuesCount: data.issues?.length || 0,
          error: data.error,
        });

        if (!response.ok) {
          const errorMessage = data.error || "Issue'lar yüklenemedi";
          console.error("JiraTaskSelector: API Error", {
            status: response.status,
            error: errorMessage,
            data,
          });
          throw new Error(errorMessage);
        }

        // API'den dönen data formatını kontrol et
        // Eğer data zaten JiraTask formatındaysa (issues array), direkt kullan
        // Eğer JiraIssue formatındaysa (fields içeren), dönüştür
        let issuesArray: JiraTask[] = [];

        if (data.issues && Array.isArray(data.issues)) {
          // Eğer issues zaten JiraTask formatındaysa (summary, status, vs. direkt var)
          if (data.issues.length > 0 && data.issues[0].summary !== undefined) {
            // Zaten JiraTask formatında
            issuesArray = data.issues.filter(
              (task: JiraTask) => task.key && task.summary
            );
          } else {
            // JiraIssue formatında (fields içeren), dönüştür
            issuesArray = (data.issues || [])
              .filter((issue: {
                id: string;
                key: string;
                fields?: {
                  summary?: string;
                  description?: string | JiraAdfDocument | { type?: string; version?: number; content?: unknown };
                  status?: { name: string; statusCategory: { colorName: string } };
                  assignee?: { displayName: string; avatarUrls: { "48x48": string } };
                  priority?: { name: string };
                  issuetype?: { name: string };
                  project?: { key: string; name: string };
                  created?: string;
                  updated?: string;
                  resolutiondate?: string;
                };
              }) => issue.key && issue.fields?.summary) // Geçerli key ve summary olanları filtrele
              .map((issue: {
                id: string;
                key: string;
                fields: {
                  summary: string;
                  description?: string | JiraAdfDocument | { type?: string; version?: number; content?: unknown };
                  status: { name: string; statusCategory: { colorName: string } };
                  assignee?: { displayName: string; avatarUrls: { "48x48": string } };
                  priority?: { name: string };
                  issuetype: { name: string };
                  project: { key: string; name: string };
                  created: string;
                  updated: string;
                  resolutiondate?: string;
                };
              }) => ({
                id: issue.id,
                key: issue.key,
                summary: issue.fields.summary || "",
                description: extractDescription(issue.fields.description),
                status: issue.fields.status.name,
                statusColor: issue.fields.status.statusCategory.colorName,
                assignee: issue.fields.assignee
                  ? {
                      name: issue.fields.assignee.displayName,
                      avatar: issue.fields.assignee.avatarUrls["48x48"],
                    }
                  : undefined,
                priority: issue.fields.priority?.name,
                type: issue.fields.issuetype.name,
                project: {
                  key: issue.fields.project.key,
                  name: issue.fields.project.name,
                },
                created: issue.fields.created,
                updated: issue.fields.updated,
                resolved: issue.fields.resolutiondate,
                url: jiraBaseUrl 
                  ? `https://${jiraBaseUrl}/browse/${issue.key}`
                  : "",
                boardId: selectedBoardId || undefined,
              }));
          }
        }

        console.log("JiraTaskSelector: Processed issues", {
          originalCount: data.issues?.length || 0,
          processedCount: issuesArray.length,
        });

        setIssues(issuesArray);
      } catch (err) {
        if (!mounted) return;
        // Fetch issues error
        setError(err instanceof Error ? err.message : "Issue'lar yüklenemedi");
        setIssues([]);
      } finally {
        if (mounted) setLoadingIssues(false);
      }
    }

    fetchIssues();

    return () => {
      mounted = false;
    };
  }, [selectedProjectKey, selectedBoardId, jiraBaseUrl, extractDescription]);

  // Filtrelenmiş issue'lar
  const filteredIssues = useMemo(() => {
    if (!searchQuery.trim()) return issues;

    const query = searchQuery.toLowerCase();
    return issues.filter(
      (issue) =>
        issue.summary.toLowerCase().includes(query) ||
        issue.key.toLowerCase().includes(query) ||
        issue.description?.toLowerCase().includes(query)
    );
  }, [issues, searchQuery]);

  const handleTaskSelect = useCallback(
    (task: JiraTask) => {
      // Task validasyonu
      if (!task || !task.key || !task.summary || !task.url) {
        console.error("Geçersiz task seçildi:", task);
        return;
      }
      
      // Task seçildiğinde board ID'yi kaydet (zaten kayıtlı olmalı ama emin olmak için)
      if (selectedBoardId) {
        try {
          localStorage.setItem(STORAGE_KEY, selectedBoardId.toString());
        } catch (storageError) {
          // LocalStorage write error
        }
      }
      onTaskSelect(task);
    },
    [onTaskSelect, selectedBoardId, STORAGE_KEY]
  );

  return (
    <div className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="border-2 border-red-300 bg-red-50 p-3 text-sm text-red-700 shadow-sm dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Board Selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Board Seçin
        </label>
        {loadingBoards ? (
          <div className="py-4 text-center">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Board&apos;lar yükleniyor...
            </p>
          </div>
        ) : boards.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="Board bulunamadı"
            description="Jira hesabınızda board bulunmuyor."
          />
        ) : (
          <FilterDropdown
            label="Board"
            value={selectedBoardId?.toString() || ""}
            options={[
              { value: "", label: "Board seçin..." },
              ...boards.map((board) => ({
                value: board.id.toString(),
                label: `${board.name} (${board.location.projectKey})`,
              })),
            ]}
            onChange={(value) => {
              const boardId = value ? Number(value) : null;
              setSelectedBoardId(boardId);
              // Seçilen board'un projectKey'ini bul
              const selectedBoard = boards.find((b) => b.id === boardId);
              setSelectedProjectKey(selectedBoard?.location.projectKey || null);
              
              // LocalStorage'a kaydet
              if (boardId) {
                try {
                  localStorage.setItem(STORAGE_KEY, boardId.toString());
                } catch (storageError) {
                  // LocalStorage write error
                }
              } else {
                try {
                  localStorage.removeItem(STORAGE_KEY);
                } catch (storageError) {
                  // LocalStorage remove error
                }
              }
            }}
            className="w-full"
          />
        )}
      </div>

      {/* Issues List */}
      {selectedBoardId && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Issue Seçin
            </label>
            {issues.length > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredIssues.length} / {issues.length} issue
              </span>
            )}
          </div>

          {/* Search */}
          {issues.length > 5 && (
            <div className="mb-3 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Issue ara..."
                className="w-full rounded-md border-2 border-gray-300 bg-white pl-10 pr-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>
          )}

          {loadingIssues ? (
            <div className="py-8 text-center">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Issue&apos;lar yükleniyor...
              </p>
            </div>
          ) : filteredIssues.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title={searchQuery ? "Arama sonucu bulunamadı" : "Issue bulunamadı"}
              description={searchQuery ? "Farklı bir arama terimi deneyin" : "Bu board'da issue bulunmuyor."}
            />
          ) : (
            <div className="max-h-[400px] space-y-2 overflow-y-auto">
              {filteredIssues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => handleTaskSelect(issue)}
                  className="w-full rounded-md border-2 border-gray-300 bg-white p-3 text-left transition-all hover:border-blue-600 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-500"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {issue.key}
                    </span>
                    <span
                      className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-semibold shadow-sm ${getStatusColorClasses(issue.statusColor || "gray")}`}
                    >
                      {issue.status}
                    </span>
                  </div>
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-white">
                    {issue.summary}
                  </h4>
                  {issue.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {issue.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    {issue.priority && (
                      <span className={`rounded-md border-2 px-2 py-0.5 text-[10px] font-medium shadow-sm ${getPriorityColorClasses(issue.priority)}`}>
                        {issue.priority}
                      </span>
                    )}
                    {issue.type && (
                      <span className="rounded-md border-2 border-purple-300 bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 shadow-sm dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                        {issue.type}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-md border-2 border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          İptal
        </button>
      </div>
    </div>
  );
});

export default JiraTaskSelector;

