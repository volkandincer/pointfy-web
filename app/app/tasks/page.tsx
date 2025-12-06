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
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                    Kişisel Task&apos;larım
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Oda açarken kullanmak üzere task&apos;larını yönet
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setShowModal(true);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border-2 border-orange-600 bg-orange-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:border-orange-700 hover:bg-orange-700"
                >
                  <Plus className="h-4 w-4" />
                  Yeni Task Ekle
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20">
                      <ClipboardList className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTasks}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Task</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-red-600 bg-red-50 dark:bg-red-900/20">
                      <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.highPriority}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Yüksek Öncelik</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20">
                      <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.mediumPriority}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Orta Öncelik</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-md border-2 border-gray-300 bg-white p-6 shadow-sm transition-all hover:border-gray-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <CheckCircle2 className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowPriority}</div>
                      <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Düşük Öncelik</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              {loading ? (
                <div className="h-40 animate-pulse border-l-4 border-l-orange-400 border-t-2 border-r-2 border-b-2 border-gray-300 bg-white p-3 shadow-sm sm:p-4 dark:border-l-orange-500 dark:border-gray-700 dark:bg-gray-900" />
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
