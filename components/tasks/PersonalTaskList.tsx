"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Calendar, ClipboardList, Link2, ExternalLink, User, Award } from "lucide-react";
import EmptyState from "@/components/jira/EmptyState";
import Button from "@/components/ui/Button";
import { getStatusColorClasses, getPriorityColorClasses } from "@/lib/jira/colors";
import { getSupabase } from "@/lib/supabase";
import type { PersonalTask } from "@/interfaces/PersonalTask.interface";
import type { JiraTask } from "@/interfaces/Jira.interface";

interface PersonalTaskListProps {
  tasks: PersonalTask[];
  onDelete: (taskId: string) => Promise<void>;
  onEdit: (task: PersonalTask) => void;
  onCreateJiraIssue?: (task: PersonalTask) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: "Genel",
  work: "İş",
  personal: "Kişisel",
  meeting: "Toplantı",
  project: "Proje",
};

const PRIORITY_COLORS = {
  1: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-700 dark:text-gray-300", label: "Düşük" },
  2: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-400", label: "Orta" },
  3: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-400", label: "Yüksek" },
};

const PersonalTaskList = memo(function PersonalTaskList({
  tasks,
  onDelete,
  onEdit,
  onCreateJiraIssue,
}: PersonalTaskListProps) {
  const router = useRouter();
  const [jiraTasks, setJiraTasks] = useState<Record<string, JiraTask>>({});
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const [loadingJira, setLoadingJira] = useState<Record<string, boolean>>({});

  // Jira base URL'i al
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

  // Jira issue bilgilerini fetch et
  const fetchJiraIssue = useCallback(async (issueKey: string) => {
    if (!jiraBaseUrl || !issueKey || jiraTasks[issueKey] || loadingJira[issueKey]) return;

    setLoadingJira((prev) => ({ ...prev, [issueKey]: true }));
    try {
      const supabase = getSupabase();
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      const urlParams = new URLSearchParams();
      urlParams.set("jiraBaseUrl", jiraBaseUrl);
      urlParams.set("userId", userData.user.id);

      const response = await fetch(
        `/api/jira/issues/${issueKey}?${urlParams.toString()}`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.issue) {
        setJiraTasks((prev) => ({ ...prev, [issueKey]: data.issue }));
      }
    } catch (err) {
      // Jira fetch error
    } finally {
      setLoadingJira((prev) => ({ ...prev, [issueKey]: false }));
    }
  }, [jiraBaseUrl, jiraTasks, loadingJira]);

  // Jira issue'ları fetch et
  useEffect(() => {
    if (!jiraBaseUrl) return;

    tasks.forEach((task) => {
      if (task.jira_issue_key && !jiraTasks[task.jira_issue_key] && !loadingJira[task.jira_issue_key]) {
        fetchJiraIssue(task.jira_issue_key);
      }
    });
  }, [tasks, jiraBaseUrl, jiraTasks, loadingJira, fetchJiraIssue]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Tarih yok";
    const date = new Date(dateString);
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getCategoryLabel = (category: string) => {
    return CATEGORY_LABELS[category] || category;
  };

  const getPriorityInfo = (priority: number) => {
    return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS[1];
  };

  const handleCardClick = useCallback((task: PersonalTask) => {
    // Eğer Jira task'ı varsa Jira detay sayfasına git
    if (task.jira_issue_key) {
      router.push(`/app/jira/issues/${task.jira_issue_key}`);
    } else {
      // Yoksa task modal'ını düzenleme modunda aç
      onEdit(task);
    }
  }, [router, onEdit]);

  // Kategori renklerini al (filtrelerdeki renklerle aynı)
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { border: string; bg: string; borderDark: string; bgDark: string }> = {
      general: { border: "#2563eb", bg: "#dbeafe", borderDark: "#3b82f6", bgDark: "rgba(30, 64, 175, 0.2)" }, // blue
      work: { border: "#16a34a", bg: "#dcfce7", borderDark: "#22c55e", bgDark: "rgba(20, 83, 45, 0.2)" }, // green
      personal: { border: "#db2777", bg: "#fce7f3", borderDark: "#ec4899", bgDark: "rgba(190, 24, 93, 0.2)" }, // pink
      meeting: { border: "#4f46e5", bg: "#e0e7ff", borderDark: "#6366f1", bgDark: "rgba(55, 48, 163, 0.2)" }, // indigo
      project: { border: "#0891b2", bg: "#cffafe", borderDark: "#06b6d4", bgDark: "rgba(8, 145, 178, 0.2)" }, // cyan
    };
    return colors[category] || colors.general;
  };

  // Priority renklerini al (filtrelerdeki renklerle aynı)
  const getPriorityColor = (priority: number) => {
    const colors: Record<number, { border: string; bg: string; borderDark: string; bgDark: string }> = {
      3: { border: "#dc2626", bg: "#fee2e2", borderDark: "#ef4444", bgDark: "rgba(220, 38, 38, 0.2)" }, // red - Yüksek
      2: { border: "#eab308", bg: "#fef9c3", borderDark: "#facc15", bgDark: "rgba(234, 179, 8, 0.2)" }, // yellow - Orta
      1: { border: "#4b5563", bg: "#f3f4f6", borderDark: "#6b7280", bgDark: "rgba(75, 85, 99, 0.2)" }, // gray - Düşük
    };
    return colors[priority] || colors[1];
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {tasks.map((t) => {
        const priorityInfo = getPriorityInfo(t.priority ?? 1);
        const hasJiraIssue = !!t.jira_issue_key && !!t.jira_issue_url;
        const jiraTask = t.jira_issue_key ? jiraTasks[t.jira_issue_key] : null;
        
        // Renk belirleme: Önce Jira, sonra kategori, sonra priority
        let cardColor;
        if (hasJiraIssue) {
          cardColor = { border: "#a855f7", bg: "#faf5ff", borderDark: "#9333ea", bgDark: "rgba(168, 85, 247, 0.2)" }; // purple
        } else {
          const categoryColor = getCategoryColor(t.category);
          cardColor = categoryColor;
        }
        
        return (
          <div
            key={t.id}
            onClick={() => handleCardClick(t)}
            className="group relative flex flex-col border-l-4 p-3 shadow-sm transition-all active:shadow-md sm:p-4 hover:shadow-md cursor-pointer"
            style={{
              borderLeftColor: cardColor.border,
              backgroundColor: cardColor.bg,
            }}
          >
            {/* Dark mode background overlay */}
            <div 
              className="pointer-events-none absolute inset-0 opacity-0 dark:opacity-100 transition-opacity" 
              style={{ backgroundColor: cardColor.bgDark }} 
            />
            {/* Header */}
            <div className="relative mb-3 flex items-start justify-between gap-2">
              <h3 className="flex-1 text-base font-bold text-gray-900 dark:text-white sm:text-lg">
                {t.title}
              </h3>
              <div className="flex shrink-0 items-center gap-1.5">
                {hasJiraIssue && (
                  <span className="rounded-md border-2 border-purple-600 bg-purple-600 px-2 py-0.5 font-mono text-xs font-bold text-white shadow-sm dark:border-purple-500 dark:bg-purple-600 dark:text-white">
                    {t.jira_issue_key}
                  </span>
                )}
                <span
                  className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold ${priorityInfo.bg} ${priorityInfo.text}`}
                  style={{
                    borderColor: t.priority === 3 ? '#dc2626' : t.priority === 2 ? '#2563eb' : '#6b7280',
                  }}
                >
                  {priorityInfo.label}
                </span>
              </div>
            </div>

            {/* Description */}
            {t.description && (
              <div className="relative mb-3">
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                  {t.description}
                </p>
              </div>
            )}

            {/* Jira Info - Minimal */}
            {hasJiraIssue && jiraTask && (
              <div className="relative mb-3 flex flex-wrap items-center gap-2">
                {jiraTask.status && (
                  <span
                    className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold shadow-sm ${getStatusColorClasses(
                      jiraTask.statusColor
                    )}`}
                  >
                    {jiraTask.status}
                  </span>
                )}
                {jiraTask.assignee && (
                  <div className="flex items-center gap-1.5 rounded-md border-2 border-gray-300 bg-gray-50 px-2 py-0.5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    {jiraTask.assignee.avatar && (
                      <img
                        src={jiraTask.assignee.avatar}
                        alt={jiraTask.assignee.name}
                        className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                      />
                    )}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {jiraTask.assignee.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Info - Minimal */}
            <div className="relative mb-3 flex flex-wrap items-center gap-2">
              <span
                className="rounded-md border-2 px-2 py-0.5 text-xs font-medium shadow-sm"
                style={{
                  borderColor: hasJiraIssue ? "#a855f7" : getCategoryColor(t.category).border,
                  backgroundColor: hasJiraIssue ? "#faf5ff" : getCategoryColor(t.category).bg,
                  color: hasJiraIssue ? "#9333ea" : getCategoryColor(t.category).border,
                }}
              >
                {getCategoryLabel(t.category)}
              </span>
              {t.created_at && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(t.created_at)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div
              className="relative mt-auto flex items-center gap-2 border-t-2 pt-3"
              style={{
                borderTopColor: hasJiraIssue ? "rgba(168, 85, 247, 0.3)" : `${cardColor.border}40`,
              }}
            >
              {hasJiraIssue ? (
                <a
                  href={t.jira_issue_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-md border-2 border-purple-600 bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:border-purple-700 hover:bg-purple-700 hover:shadow-md active:border-purple-800 active:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-purple-500 dark:bg-purple-600 dark:hover:border-purple-400 dark:hover:bg-purple-500 min-h-[36px]"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Jira&apos;da Aç</span>
                </a>
              ) : onCreateJiraIssue ? (
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateJiraIssue(t);
                  }}
                  variant="primary"
                  size="sm"
                  icon={Link2}
                  fullWidth
                  className="!border-orange-600 !bg-orange-600 hover:!border-orange-700 hover:!bg-orange-700 dark:!border-orange-500 dark:!bg-orange-600 dark:hover:!border-orange-400 dark:hover:!bg-orange-500"
                >
                  Jira&apos;da Aç
                </Button>
              ) : null}
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(t);
                }}
                variant="secondary"
                size="sm"
                icon={Edit}
                className="!border-gray-300 !bg-white !text-gray-700 hover:!border-gray-400 hover:!bg-gray-50 dark:!border-gray-700 dark:!bg-gray-800 dark:!text-gray-300 dark:hover:!border-gray-600 dark:hover:!bg-gray-700"
              />
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`"${t.title}" task'ını silmek istediğinize emin misiniz?`)) {
                    onDelete(t.id);
                  }
                }}
                variant="danger"
                size="sm"
                icon={Trash2}
              />
            </div>
          </div>
        );
      })}
      {tasks.length === 0 && (
        <div className="col-span-full">
          <EmptyState
            icon={ClipboardList}
            title="Henüz task yok"
            description="İlk task'ınızı ekleyerek başlayın"
          />
        </div>
      )}
    </div>
  );
});

export default PersonalTaskList;
