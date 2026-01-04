"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ClipboardList, AlertCircle, CheckCircle2, Link2, Folder, RefreshCw, CheckSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageHeader from "@/components/layout/PageHeader";
import Button from "@/components/ui/Button";
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
            <PageHeader
              title="Kişisel Task'larım"
              description="Oda açarken kullanmak üzere task'larını yönet"
              icon={CheckSquare}
              iconColor="blue"
              actions={
                <>
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
                </>
              }
            />
            <div className="mb-6">

              {/* Stats Cards - Minimal & Clickable Filters */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 sm:gap-3">
                <button
                  onClick={() => setFilterType(null)}
                  className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    filterType === null
                      ? "border-orange-600 dark:border-orange-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20 sm:h-10 sm:w-10">
                    <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.totalTasks}</div>
                    <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Toplam</div>
                  </div>
                </button>

                {stats.highPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 3 ? null : 3)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 3
                        ? "border-red-600 dark:border-red-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-red-600 bg-red-50 dark:bg-red-900/20 sm:h-10 sm:w-10">
                      <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.highPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Yüksek</div>
                    </div>
                  </button>
                )}

                {stats.mediumPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 2 ? null : 2)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 2
                        ? "border-yellow-600 dark:border-yellow-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-10 sm:w-10">
                      <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.mediumPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Orta</div>
                    </div>
                  </button>
                )}

                {stats.lowPriority > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === 1 ? null : 1)}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === 1
                        ? "border-gray-600 dark:border-gray-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-gray-600 bg-gray-50 dark:bg-gray-800 sm:h-10 sm:w-10">
                      <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.lowPriority}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Düşük</div>
                    </div>
                  </button>
                )}

                {stats.jiraTasks > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "jira" ? null : "jira")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "jira"
                        ? "border-purple-600 dark:border-purple-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20 sm:h-10 sm:w-10">
                      <Link2 className="h-4 w-4 text-purple-600 dark:text-purple-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.jiraTasks}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Jira&apos;da</div>
                    </div>
                  </button>
                )}

                {/* Category Filters */}
                {stats.generalCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "general" ? null : "general")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "general"
                        ? "border-blue-600 dark:border-blue-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-blue-600 dark:text-blue-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.generalCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Genel</div>
                    </div>
                  </button>
                )}

                {stats.workCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "work" ? null : "work")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "work"
                        ? "border-green-600 dark:border-green-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-green-600 bg-green-50 dark:bg-green-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-green-600 dark:text-green-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.workCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">İş</div>
                    </div>
                  </button>
                )}

                {stats.personalCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "personal" ? null : "personal")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "personal"
                        ? "border-pink-600 dark:border-pink-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-pink-600 bg-pink-50 dark:bg-pink-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-pink-600 dark:text-pink-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.personalCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Kişisel</div>
                    </div>
                  </button>
                )}

                {stats.meetingCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "meeting" ? null : "meeting")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "meeting"
                        ? "border-indigo-600 dark:border-indigo-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.meetingCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Toplantı</div>
                    </div>
                  </button>
                )}

                {stats.projectCategory > 0 && (
                  <button
                    onClick={() => setFilterType(filterType === "project" ? null : "project")}
                    className={`group flex flex-col items-center gap-1.5 border-2 bg-white p-2.5 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-3 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                      filterType === "project"
                        ? "border-cyan-600 dark:border-cyan-500"
                        : "border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 sm:h-10 sm:w-10">
                      <Folder className="h-4 w-4 text-cyan-600 dark:text-cyan-400 sm:h-5 sm:w-5" />
                    </div>
                    <div className="text-center">
                      <div className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">{stats.projectCategory}</div>
                      <div className="text-[10px] font-medium text-gray-600 dark:text-gray-400 sm:text-xs">Proje</div>
                    </div>
                  </button>
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
