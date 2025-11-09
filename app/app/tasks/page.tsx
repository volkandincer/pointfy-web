"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
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

      const channel = supabase.channel("personal-tasks-" + data.user.id).on(
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
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? (payload.new as PersonalTask) : t
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
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
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
                className="inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                + Yeni Task Ekle
              </button>
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
    </RequireAuth>
  );
}
