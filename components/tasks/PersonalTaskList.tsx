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

  // Kategori renklerini al (gradient için)
  const getCategoryColor = (category: string) => {
    const colors: Record<string, { 
      border: string; 
      bg: string; 
      bgGradient: string;
      borderDark: string; 
      bgDark: string;
      bgGradientDark: string;
    }> = {
      general: { 
        border: "#2563eb", 
        bg: "#dbeafe", 
        bgGradient: "from-blue-50 via-blue-100/50 to-white",
        borderDark: "#3b82f6", 
        bgDark: "rgba(30, 64, 175, 0.3)",
        bgGradientDark: "from-blue-950/40 via-blue-900/30 to-gray-900"
      },
      work: { 
        border: "#16a34a", 
        bg: "#dcfce7", 
        bgGradient: "from-green-50 via-green-100/50 to-white",
        borderDark: "#22c55e", 
        bgDark: "rgba(20, 83, 45, 0.3)",
        bgGradientDark: "from-green-950/40 via-green-900/30 to-gray-900"
      },
      personal: { 
        border: "#db2777", 
        bg: "#fce7f3", 
        bgGradient: "from-pink-50 via-pink-100/50 to-white",
        borderDark: "#ec4899", 
        bgDark: "rgba(190, 24, 93, 0.3)",
        bgGradientDark: "from-pink-950/40 via-pink-900/30 to-gray-900"
      },
      meeting: { 
        border: "#4f46e5", 
        bg: "#e0e7ff", 
        bgGradient: "from-indigo-50 via-indigo-100/50 to-white",
        borderDark: "#6366f1", 
        bgDark: "rgba(55, 48, 163, 0.3)",
        bgGradientDark: "from-indigo-950/40 via-indigo-900/30 to-gray-900"
      },
      project: { 
        border: "#0891b2", 
        bg: "#cffafe", 
        bgGradient: "from-cyan-50 via-cyan-100/50 to-white",
        borderDark: "#06b6d4", 
        bgDark: "rgba(8, 145, 178, 0.3)",
        bgGradientDark: "from-cyan-950/40 via-cyan-900/30 to-gray-900"
      },
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {tasks.map((t) => {
        const priorityInfo = getPriorityInfo(t.priority ?? 1);
        const hasJiraIssue = !!t.jira_issue_key && !!t.jira_issue_url;
        const jiraTask = t.jira_issue_key ? jiraTasks[t.jira_issue_key] : null;
        
        // Renk belirleme: Önce Jira, sonra kategori, sonra priority
        let cardColor;
        if (hasJiraIssue) {
          cardColor = { 
            border: "#a855f7", 
            bg: "#faf5ff", 
            bgGradient: "from-purple-50 via-purple-100/50 to-white",
            borderDark: "#9333ea", 
            bgDark: "rgba(168, 85, 247, 0.3)",
            bgGradientDark: "from-purple-950/40 via-purple-900/30 to-gray-900"
          };
        } else {
          const categoryColor = getCategoryColor(t.category);
          cardColor = categoryColor;
        }
        
        return (
          <div
            key={t.id}
            onClick={() => handleCardClick(t)}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-5 transition-all hover:border-gray-400 hover:shadow-lg cursor-pointer dark:border-gray-700 dark:bg-gray-900"
            style={{
              borderColor: cardColor.border,
            }}
          >
            {/* Top Color Bar */}
            <div
              className="absolute left-0 top-0 h-1.5 w-full"
              style={{ backgroundColor: cardColor.border }}
            />

            {/* Header */}
            <div className="relative mb-3 flex items-start justify-between gap-2">
              <h3 className="flex-1 text-base font-bold text-gray-900 dark:text-white line-clamp-2">
                {t.title}
              </h3>
              <div className="flex shrink-0 items-center gap-1.5">
                {hasJiraIssue && (
                  <span className="rounded-md border border-purple-600 bg-purple-600 px-2 py-1 font-mono text-xs font-bold text-white shadow-sm dark:border-purple-500 dark:bg-purple-600">
                    {t.jira_issue_key}
                  </span>
                )}
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-semibold shadow-sm ${priorityInfo.bg} ${priorityInfo.text}`}
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
              <div className="relative mb-4">
                <p className="line-clamp-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {t.description}
                </p>
              </div>
            )}

            {/* Jira Info - Minimal */}
            {hasJiraIssue && jiraTask && (
              <div className="relative mb-2 flex flex-wrap items-center gap-1.5">
                {jiraTask.status && (
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold ${getStatusColorClasses(
                      jiraTask.statusColor
                    )}`}
                  >
                    {jiraTask.status}
                  </span>
                )}
                {jiraTask.assignee && (
                  <div className="flex items-center gap-1 rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 dark:border-gray-700 dark:bg-gray-800">
                    {jiraTask.assignee.avatar && (
                      <img
                        src={jiraTask.assignee.avatar}
                        alt={jiraTask.assignee.name}
                        className="h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600"
                      />
                    )}
                    <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">
                      {jiraTask.assignee.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Info - Minimal */}
            <div className="relative mb-4 flex flex-wrap items-center gap-2">
              <span
                className="rounded-md border px-2.5 py-1 text-xs font-medium shadow-sm"
                style={{
                  borderColor: hasJiraIssue ? "#a855f7" : getCategoryColor(t.category).border,
                  backgroundColor: hasJiraIssue ? "#faf5ff" : getCategoryColor(t.category).bg,
                  color: hasJiraIssue ? "#9333ea" : getCategoryColor(t.category).border,
                }}
              >
                {getCategoryLabel(t.category)}
              </span>
              {t.created_at && (
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(t.created_at)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="relative mt-auto flex items-center gap-2 border-t-2 pt-4" style={{ borderTopColor: `${cardColor.border}40` }}>
              {hasJiraIssue ? (
                <a
                  href={t.jira_issue_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 inline-flex h-9 items-center justify-center gap-2 rounded-md border-2 px-4 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                  style={{
                    borderColor: cardColor.border,
                    backgroundColor: cardColor.border,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = cardColor.borderDark;
                    e.currentTarget.style.backgroundColor = cardColor.borderDark;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = cardColor.border;
                    e.currentTarget.style.backgroundColor = cardColor.border;
                  }}
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
                  className="!h-9 !text-white !shadow-sm hover:!shadow-md"
                  style={{
                    borderColor: cardColor.border,
                    backgroundColor: cardColor.border,
                  }}
                >
                  Jira&apos;da Aç
                </Button>
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(t);
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 transition-colors hover:bg-white/10"
                style={{
                  borderColor: cardColor.border,
                  color: cardColor.border,
                }}
                title="Düzenle"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`"${t.title}" task'ını silmek istediğinize emin misiniz?`)) {
                    onDelete(t.id);
                  }
                }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-red-400 text-red-400 transition-colors hover:bg-red-400/10 dark:border-red-500 dark:text-red-500"
                title="Sil"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
