"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Link2, Folder, RefreshCw } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import SectionHeader from "@/components/ui/SectionHeader";
import StatsCard from "@/components/ui/StatsCard";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type {
  PersonalTask,
  PersonalTaskInput,
} from "@/interfaces/PersonalTask.interface";
import PersonalTaskList from "@/components/tasks/PersonalTaskList";
import PersonalTaskModal from "@/components/tasks/PersonalTaskModal";
import CreateJiraIssueModal from "@/components/tasks/CreateJiraIssueModal";
import { getSupabase } from "@/lib/supabase";
import { useToastContext } from "@/contexts/ToastContext";

export default function PersonalTasksPage() {
  const navigationItems: NavigationItem[] = useMemo(
    () => getDefaultNavigationItems(),
    []
  );
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userKey, setUserKey] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [filterType, setFilterType] = useState<number | "jira" | string | null>(null);
  const [showJiraModal, setShowJiraModal] = useState<boolean>(false);
  const [selectedTaskForJira, setSelectedTaskForJira] = useState<PersonalTask | null>(null);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState<string>("");
  const { showToast } = useToastContext();

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter((t) => t.priority === 3).length;
    const mediumPriority = tasks.filter((t) => t.priority === 2).length;
    const lowPriority = tasks.filter((t) => t.priority === 1).length;
    const jiraTasks = tasks.filter((t) => !!t.jira_issue_key && !!t.jira_issue_url).length;
    const generalCategory = tasks.filter((t) => t.category === "general").length;
    const workCategory = tasks.filter((t) => t.category === "work").length;
    const personalCategory = tasks.filter((t) => t.category === "personal").length;
    const meetingCategory = tasks.filter((t) => t.category === "meeting").length;
    const projectCategory = tasks.filter((t) => t.category === "project").length;
    return { 
      totalTasks, 
      highPriority, 
      mediumPriority, 
      lowPriority, 
      jiraTasks,
      generalCategory,
      workCategory,
      personalCategory,
      meetingCategory,
      projectCategory,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filterType === null) return tasks;
    if (filterType === "jira") {
      return tasks.filter((t) => !!t.jira_issue_key && !!t.jira_issue_url);
    }
    if (typeof filterType === "string" && ["general", "work", "personal", "meeting", "project"].includes(filterType)) {
      return tasks.filter((t) => t.category === filterType);
    }
    return tasks.filter((t) => t.priority === filterType);
  }, [tasks, filterType]);

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

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!data.user) return;
      setUserKey(data.user.id);
      const { data: rows } = await supabase
        .from("user_personal_tasks")
        .select(
          "id, user_key, title, description, category, priority, created_at, jira_issue_key, jira_issue_url"
        )
        .eq("user_key", data.user.id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (!mounted) return;
      setTasks(rows || []);
      setLoading(false);

      const channel = supabase.channel("personal-tasks-" + data.user.id);
      channel.on(
        // @ts-expect-error - Supabase channel type inference issue
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_personal_tasks",
          filter: `user_key=eq.${data.user.id}`,
        },
        (payload: { eventType: string; new?: PersonalTask; old?: { id: string } }) => {
          if (!mounted) return;
          if (payload.eventType === "INSERT") {
            setTasks((prev) => [payload.new as PersonalTask, ...prev]);
          } else if (payload.eventType === "DELETE" && payload.old) {
            const oldId = payload.old.id;
            setTasks((prev) => prev.filter((t) => t.id !== oldId));
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const newTask = payload.new as PersonalTask;
            setTasks((prev) =>
              prev.map((t) =>
                t.id === newTask.id ? newTask : t
              )
            );
          }
        }
      );
      channel.subscribe();
      unsubscribe = () => channel.unsubscribe();
    })();
    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleCreate = useCallback(
    async (input: PersonalTaskInput) => {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_personal_tasks")
        .insert({
          user_key: userKey,
          title: input.title,
          description: input.description ?? null,
          category: input.category ?? "general",
          priority: input.priority ?? 1,
        })
        .select()
        .single();
      if (!error && data) setTasks((prev) => [data as PersonalTask, ...prev]);
    },
    [userKey]
  );

  const handleDelete = useCallback(async (taskId: string) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("user_personal_tasks")
      .delete()
      .eq("id", taskId);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleSyncJira = useCallback(async () => {
    if (!userKey || !jiraBaseUrl) {
      showToast("Jira bağlantısı gerekli", "error");
      return;
    }

    setSyncing(true);
    try {
      const response = await fetch(`/api/tasks/sync-jira?userId=${userKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          jiraBaseUrl,
          maxResults: 100,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync başarısız");
      }

      // Task'ları yeniden yükle
      const supabase = getSupabase();
      const { data: rows } = await supabase
        .from("user_personal_tasks")
        .select(
          "id, user_key, title, description, category, priority, created_at, jira_issue_key, jira_issue_url"
        )
        .eq("user_key", userKey)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      setTasks(rows || []);

      showToast(
        `${data.synced} task sync edildi (${data.created} yeni, ${data.updated} güncellendi)`,
        "success"
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Sync sırasında hata oluştu",
        "error"
      );
    } finally {
      setSyncing(false);
    }
  }, [userKey, jiraBaseUrl, showToast]);

  return (
    <>
      <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <SectionHeader
                  title="Kişisel Task'larım"
                  description="Oda açarken kullanmak üzere task'larını yönet"
                />
                <div className="flex shrink-0 items-center gap-2">
                  {jiraBaseUrl && (
                    <Button
                      onClick={handleSyncJira}
                      variant="secondary"
                      size="md"
                      icon={RefreshCw}
                      loading={syncing}
                      disabled={syncing}
                      className="!border-purple-600 !bg-white !text-purple-600 hover:!border-purple-700 hover:!bg-purple-50 dark:!border-purple-500 dark:!bg-gray-800 dark:!text-purple-400 dark:hover:!border-purple-400 dark:hover:!bg-purple-900/20"
                    >
                      Jira&apos;dan Sync
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setEditingTask(null);
                      setShowModal(true);
                    }}
                    variant="primary"
                    size="md"
                    icon={Plus}
                    className="!border-orange-600 !bg-orange-600 hover:!border-orange-700 hover:!bg-orange-700 dark:!border-orange-500 dark:!bg-orange-600 dark:hover:!border-orange-400 dark:hover:!bg-orange-500"
                  >
                    Yeni Task Ekle
                  </Button>
                </div>
              </div>

              {/* Stats Cards - Modern & Clickable Filters */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <StatsCard
                  icon={ClipboardList}
                  value={stats.totalTasks}
                  label="Toplam Task"
                  color="orange"
                  onClick={() => setFilterType(filterType === null ? null : null)}
                  className={filterType === null ? "ring-2 ring-orange-500" : ""}
                />

                {stats.highPriority > 0 && (
                  <StatsCard
                    icon={AlertCircle}
                    value={stats.highPriority}
                    label="Yüksek Öncelik"
                    color="red"
                    onClick={() => setFilterType(filterType === 3 ? null : 3)}
                    className={filterType === 3 ? "ring-2 ring-red-500" : ""}
                  />
                )}

                {stats.mediumPriority > 0 && (
                  <StatsCard
                    icon={AlertCircle}
                    value={stats.mediumPriority}
                    label="Orta Öncelik"
                    color="yellow"
                    onClick={() => setFilterType(filterType === 2 ? null : 2)}
                    className={filterType === 2 ? "ring-2 ring-yellow-500" : ""}
                  />
                )}

                {stats.lowPriority > 0 && (
                  <StatsCard
                    icon={CheckCircle2}
                    value={stats.lowPriority}
                    label="Düşük Öncelik"
                    color="primary"
                    onClick={() => setFilterType(filterType === 1 ? null : 1)}
                    className={filterType === 1 ? "ring-2 ring-primary" : ""}
                  />
                )}

                {stats.jiraTasks > 0 && (
                  <StatsCard
                    icon={Link2}
                    value={stats.jiraTasks}
                    label="Jira&apos;da"
                    color="purple"
                    onClick={() => setFilterType(filterType === "jira" ? null : "jira")}
                    className={filterType === "jira" ? "ring-2 ring-purple-500" : ""}
                  />
                )}

                {/* Category Stats */}
                {stats.generalCategory > 0 && (
                  <StatsCard
                    icon={Folder}
                    value={stats.generalCategory}
                    label="Genel"
                    color="blue"
                    onClick={() => setFilterType(filterType === "general" ? null : "general")}
                    className={filterType === "general" ? "ring-2 ring-blue-500" : ""}
                  />
                )}

                {stats.workCategory > 0 && (
                  <StatsCard
                    icon={Folder}
                    value={stats.workCategory}
                    label="İş"
                    color="green"
                    onClick={() => setFilterType(filterType === "work" ? null : "work")}
                    className={filterType === "work" ? "ring-2 ring-green-500" : ""}
                  />
                )}

                {stats.personalCategory > 0 && (
                  <StatsCard
                    icon={Folder}
                    value={stats.personalCategory}
                    label="Kişisel"
                    color="pink"
                    onClick={() => setFilterType(filterType === "personal" ? null : "personal")}
                    className={filterType === "personal" ? "ring-2 ring-pink-500" : ""}
                  />
                )}

                {stats.meetingCategory > 0 && (
                  <StatsCard
                    icon={Folder}
                    value={stats.meetingCategory}
                    label="Toplantı"
                    color="indigo"
                    onClick={() => setFilterType(filterType === "meeting" ? null : "meeting")}
                    className={filterType === "meeting" ? "ring-2 ring-indigo-500" : ""}
                  />
                )}

                {stats.projectCategory > 0 && (
                  <StatsCard
                    icon={Folder}
                    value={stats.projectCategory}
                    label="Proje"
                    color="cyan"
                    onClick={() => setFilterType(filterType === "project" ? null : "project")}
                    className={filterType === "project" ? "ring-2 ring-cyan-500" : ""}
                  />
                )}
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-40 animate-pulse border-l-4 border-l-orange-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-orange-500 dark:border-gray-700 dark:bg-gray-900" />
              ) : (
                <PersonalTaskList
                  tasks={filteredTasks}
                  onDelete={handleDelete}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setShowModal(true);
                  }}
                  onCreateJiraIssue={(t) => {
                    setSelectedTaskForJira(t);
                    setShowJiraModal(true);
                  }}
                />
              )}
            </div>
          </div>
        </main>
        <PersonalTaskModal
          open={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={async (input, taskId) => {
            if (taskId) {
              // update
              const supabase = getSupabase();
              const { data, error } = await supabase
                .from("user_personal_tasks")
                .update({
                  title: input.title,
                  description: input.description ?? null,
                  category: input.category ?? "general",
                  priority: input.priority ?? 1,
                })
                .eq("id", taskId)
                .select()
                .single();
              if (!error && data) {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.id === taskId ? (data as PersonalTask) : t
                  )
                );
              }
            } else {
              await handleCreate(input);
            }
            setEditingTask(null);
          }}
          initialTask={editingTask ?? undefined}
        />
        {selectedTaskForJira && (
          <CreateJiraIssueModal
            open={showJiraModal}
            onClose={() => {
              setShowJiraModal(false);
              setSelectedTaskForJira(null);
            }}
            onSuccess={async (issueKey, issueUrl) => {
              if (selectedTaskForJira) {
                // Task'a Jira bilgilerini kaydet
                const supabase = getSupabase();
                const { error } = await supabase
                  .from("user_personal_tasks")
                  .update({
                    jira_issue_key: issueKey,
                    jira_issue_url: issueUrl,
                  })
                  .eq("id", selectedTaskForJira.id);

                if (!error) {
                  // Task listesini güncelle
                  setTasks((prev) =>
                    prev.map((t) =>
                      t.id === selectedTaskForJira.id
                        ? { ...t, jira_issue_key: issueKey, jira_issue_url: issueUrl }
                        : t
                    )
                  );
                }
              }
              showToast(
                `Jira issue başarıyla oluşturuldu: ${issueKey}`,
                "success"
              );
              setShowJiraModal(false);
              setSelectedTaskForJira(null);
            }}
            personalTask={selectedTaskForJira}
          />
        )}
        <Footer navigationItems={navigationItems} />
    </>
  );
}
