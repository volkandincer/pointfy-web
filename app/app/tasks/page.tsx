"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ClipboardList, AlertCircle, CheckCircle2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
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
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);

  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const highPriority = tasks.filter((t) => t.priority === 3).length;
    const mediumPriority = tasks.filter((t) => t.priority === 2).length;
    const lowPriority = tasks.filter((t) => t.priority === 1).length;
    return { totalTasks, highPriority, mediumPriority, lowPriority };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (priorityFilter === null) return tasks;
    return tasks.filter((t) => t.priority === priorityFilter);
  }, [tasks, priorityFilter]);

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
                <Button
                  onClick={() => {
                    setEditingTask(null);
                    setShowModal(true);
                  }}
                  variant="primary"
                  size="md"
                  icon={Plus}
                  className="border-orange-600 bg-orange-600 hover:border-orange-700 hover:bg-orange-700"
                >
                  Yeni Task Ekle
                </Button>
              </div>

              {/* Stats Cards - Minimal & Clickable Filters */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <button
                  onClick={() => setPriorityFilter(null)}
                  className={`group flex items-center gap-2 border-2 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    priorityFilter === null
                      ? "border-orange-600 dark:border-orange-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20 sm:h-10 sm:w-10">
                    <ClipboardList className="h-4 w-4 text-orange-600 dark:text-orange-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{stats.totalTasks}</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Toplam</div>
                  </div>
                </button>

                <button
                  onClick={() => setPriorityFilter(priorityFilter === 3 ? null : 3)}
                  className={`group flex items-center gap-2 border-2 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    priorityFilter === 3
                      ? "border-red-600 dark:border-red-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-red-600 bg-red-50 dark:bg-red-900/20 sm:h-10 sm:w-10">
                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{stats.highPriority}</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Yüksek</div>
                  </div>
                </button>

                <button
                  onClick={() => setPriorityFilter(priorityFilter === 2 ? null : 2)}
                  className={`group flex items-center gap-2 border-2 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    priorityFilter === 2
                      ? "border-yellow-600 dark:border-yellow-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 sm:h-10 sm:w-10">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{stats.mediumPriority}</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Orta</div>
                  </div>
                </button>

                <button
                  onClick={() => setPriorityFilter(priorityFilter === 1 ? null : 1)}
                  className={`group flex items-center gap-2 border-2 bg-white p-3 shadow-sm transition-all active:border-gray-400 active:shadow-md sm:p-4 hover:border-gray-400 hover:shadow-md dark:bg-gray-900 ${
                    priorityFilter === 1
                      ? "border-gray-600 dark:border-gray-500"
                      : "border-gray-300 dark:border-gray-700"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center border-2 border-gray-600 bg-gray-50 dark:bg-gray-800 sm:h-10 sm:w-10">
                    <CheckCircle2 className="h-4 w-4 text-gray-600 dark:text-gray-400 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl">{stats.lowPriority}</div>
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 sm:text-sm">Düşük</div>
                  </div>
                </button>
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
