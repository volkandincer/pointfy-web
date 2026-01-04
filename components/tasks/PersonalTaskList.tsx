"use client";

import { memo, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Calendar, ClipboardList, Link2, ExternalLink } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { getStatusColorClasses } from "@/lib/jira/colors";
import Image from "next/image";
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
  1: { bg: "bg-muted", text: "text-card-foreground", label: "Düşük" },
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
      } catch {
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
    } catch {
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

  // Kategori renklerini al (theme-aware Tailwind classes)
  const getCategoryColorClasses = (category: string) => {
    const colors: Record<string, { border: string; bg: string; text: string }> = {
      general: { 
        border: "border-l-blue-600 dark:border-l-blue-500", 
        bg: "bg-blue-50 dark:bg-blue-950/30", 
        text: "text-blue-700 dark:text-blue-400" 
      },
      work: { 
        border: "border-l-green-600 dark:border-l-green-500", 
        bg: "bg-green-50 dark:bg-green-950/30", 
        text: "text-green-700 dark:text-green-400" 
      },
      personal: { 
        border: "border-l-pink-600 dark:border-l-pink-500", 
        bg: "bg-pink-50 dark:bg-pink-950/30", 
        text: "text-pink-700 dark:text-pink-400" 
      },
      meeting: { 
        border: "border-l-indigo-600 dark:border-l-indigo-500", 
        bg: "bg-indigo-50 dark:bg-indigo-950/30", 
        text: "text-indigo-700 dark:text-indigo-400" 
      },
      project: { 
        border: "border-l-cyan-600 dark:border-l-cyan-500", 
        bg: "bg-cyan-50 dark:bg-cyan-950/30", 
        text: "text-cyan-700 dark:text-cyan-400" 
      },
    };
    return colors[category] || colors.general;
  };

  // Priority renklerini al (theme-aware Tailwind classes)
  const getPriorityColorClasses = (priority: number) => {
    const colors: Record<number, { border: string; bg: string; text: string }> = {
      3: { 
        border: "border-red-600 dark:border-red-500", 
        bg: "bg-red-100 dark:bg-red-950/40", 
        text: "text-red-700 dark:text-red-400" 
      },
      2: { 
        border: "border-yellow-600 dark:border-yellow-500", 
        bg: "bg-yellow-100 dark:bg-yellow-950/40", 
        text: "text-yellow-700 dark:text-yellow-400" 
      },
      1: { 
        border: "border-gray-500 dark:border-gray-500", 
        bg: "bg-gray-100 dark:bg-gray-800", 
        text: "text-card-foreground" 
      },
    };
    return colors[priority] || colors[1];
  };

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 sm:gap-4">
      {tasks.map((t) => {
        const priorityInfo = getPriorityInfo(t.priority ?? 1);
        const hasJiraIssue = !!t.jira_issue_key && !!t.jira_issue_url;
        const jiraTask = t.jira_issue_key ? jiraTasks[t.jira_issue_key] : null;
        
        // Renk belirleme: Önce Jira, sonra kategori
        const categoryColors = getCategoryColorClasses(t.category);
        const borderColor = hasJiraIssue 
          ? "border-l-purple-600 dark:border-l-purple-500"
          : categoryColors.border;
        const glowColor = hasJiraIssue
          ? "from-purple-500/10 to-purple-500/5"
          : t.category === "general"
          ? "from-blue-500/10 to-blue-500/5"
          : t.category === "work"
          ? "from-green-500/10 to-green-500/5"
          : t.category === "personal"
          ? "from-pink-500/10 to-pink-500/5"
          : t.category === "meeting"
          ? "from-indigo-500/10 to-indigo-500/5"
          : t.category === "project"
          ? "from-cyan-500/10 to-cyan-500/5"
          : "from-primary/10 to-primary/5";
        
        return (
          <div
            key={t.id}
            onClick={() => handleCardClick(t)}
            className={`group relative flex min-h-[140px] flex-col overflow-hidden rounded-lg border-l-4 ${borderColor} border-t-2 border-r-2 border-b-2 border-border bg-gradient-to-br from-card via-card to-card/50 p-4 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-border hover:shadow-xl cursor-pointer`}
          >
            {/* Glow Effect */}
            <div className={`absolute right-0 top-0 h-24 w-24 translate-x-6 -translate-y-6 rounded-full bg-gradient-to-br ${glowColor} blur-xl transition-all group-hover:scale-150`} />
            {/* Content */}
            <div className="relative z-10 flex flex-1 flex-col">
              {/* Header */}
              <div className="relative mb-3 flex items-start justify-between gap-2">
              <h3 className="flex-1 text-base font-bold text-card-foreground sm:text-lg">
                {t.title}
              </h3>
              <div className="flex shrink-0 items-center gap-1.5">
                {hasJiraIssue && (
                  <span className="rounded-md border-2 border-purple-600 bg-purple-600 px-2 py-0.5 font-mono text-xs font-bold text-white shadow-sm dark:border-purple-500 dark:bg-purple-600 dark:text-white">
                    {t.jira_issue_key}
                  </span>
                )}
                <span
                  className={`rounded-md border-2 px-2 py-0.5 text-xs font-semibold ${getPriorityColorClasses(t.priority ?? 1).border} ${getPriorityColorClasses(t.priority ?? 1).bg} ${getPriorityColorClasses(t.priority ?? 1).text}`}
                >
                  {priorityInfo.label}
                </span>
              </div>
            </div>

            {/* Description */}
            {t.description && (
              <div className="relative mb-3">
                <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
                      <Image
                        src={jiraTask.assignee.avatar}
                        alt={jiraTask.assignee.name}
                        width={16}
                        height={16}
                        className="h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                      />
                    )}
                    <span className="text-xs font-medium text-card-foreground">
                      {jiraTask.assignee.name}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Info - Minimal */}
            <div className="relative mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-md border-2 px-2 py-0.5 text-xs font-medium shadow-sm ${
                  hasJiraIssue
                    ? "border-purple-600 bg-purple-100 text-purple-700 dark:border-purple-500 dark:bg-purple-950/40 dark:text-purple-400"
                    : `${categoryColors.border.replace("border-l-", "border-")} ${categoryColors.bg} ${categoryColors.text}`
                }`}
              >
                {getCategoryLabel(t.category)}
              </span>
              {t.created_at && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(t.created_at)}</span>
                </div>
              )}
            </div>

              {/* Actions */}
              <div
                className={`relative mt-auto flex items-center gap-2 border-t-2 border-border pt-3`}
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
                className="!border-border !bg-card !text-card-foreground hover:!border-border hover:!bg-accent"
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
