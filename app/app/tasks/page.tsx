"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type {
  PersonalTask,
  PersonalTaskInput,
} from "@/interfaces/PersonalTask.interface";
import PersonalTaskList from "@/components/tasks/PersonalTaskList";
import PersonalTaskModal from "@/components/tasks/PersonalTaskModal";
import { getSupabase } from "@/lib/supabase";

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

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter((t) => t.priority === 3).length;
    const mediumPriority = tasks.filter((t) => t.priority === 2).length;
    const lowPriority = tasks.filter((t) => t.priority === 1).length;
    return { totalTasks, highPriority, mediumPriority, lowPriority };
  }, [tasks]);

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
          "id, user_key, title, description, category, priority, created_at"
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

  return (
    <>
      <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                    Kişisel Task&apos;larım
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Oda açarken kullanmak üzere task&apos;larını yönet
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowModal(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Task Ekle
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="group relative overflow-hidden rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-blue-300/70 hover:shadow-xl dark:border-blue-800/50 dark:from-blue-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-blue-700/70">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-blue-400/20 to-blue-600/20 blur-2xl transition-all group-hover:scale-150" />
                  <div className="relative mb-4 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/40">
                      <ClipboardList className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Task</div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-red-200/50 bg-gradient-to-br from-red-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-red-300/70 hover:shadow-xl dark:border-red-800/50 dark:from-red-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-red-700/70">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-red-400/20 to-red-600/20 blur-2xl transition-all group-hover:scale-150" />
                  <div className="relative mb-4 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-red-500/40">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.highPriority}</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Yüksek Öncelik</div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-yellow-200/50 bg-gradient-to-br from-yellow-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-yellow-300/70 hover:shadow-xl dark:border-yellow-800/50 dark:from-yellow-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-yellow-700/70">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 blur-2xl transition-all group-hover:scale-150" />
                  <div className="relative mb-4 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-yellow-500/40">
                      <AlertCircle className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.mediumPriority}</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Orta Öncelik</div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-gray-200/50 bg-gradient-to-br from-gray-50 via-white to-white p-6 shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-gray-300/70 hover:shadow-xl dark:border-gray-800/50 dark:from-gray-950/30 dark:via-gray-900 dark:to-gray-900 dark:hover:border-gray-700/70">
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br from-gray-400/20 to-gray-600/20 blur-2xl transition-all group-hover:scale-150" />
                  <div className="relative mb-4 flex items-center justify-between">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30 transition-transform group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-gray-500/40">
                      <CheckCircle2 className="h-7 w-7" />
                    </div>
                  </div>
                  <div className="relative">
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.lowPriority}</div>
                    <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">Düşük Öncelik</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
              ) : (
                <PersonalTaskList
                  tasks={tasks}
                  onDelete={handleDelete}
                  onEdit={(t) => {
                    setEditingTask(t);
                    setShowModal(true);
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
        <Footer navigationItems={navigationItems} />
    </>
  );
}
