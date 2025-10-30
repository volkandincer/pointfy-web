"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RequireAuth from "@/components/auth/RequireAuth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getDefaultNavigationItems } from "@/lib/utils";
import type { NavigationItem } from "@/interfaces/Navigation.interface";
import type { PersonalTask, PersonalTaskInput } from "@/interfaces/PersonalTask.interface";
import PersonalTaskForm from "@/components/tasks/PersonalTaskForm";
import PersonalTaskList from "@/components/tasks/PersonalTaskList";
import { getSupabase } from "@/lib/supabase";

export default function PersonalTasksPage() {
  const navigationItems: NavigationItem[] = useMemo(() => getDefaultNavigationItems(), []);
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userKey, setUserKey] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!data.user) return;
      setUserKey(data.user.id);
      const { data: rows } = await supabase
        .from("user_personal_tasks")
        .select("id, user_key, title, description, category, priority, created_at")
        .eq("user_key", data.user.id)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      if (!mounted) return;
      setTasks(rows || []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreate = useCallback(async (input: PersonalTaskInput) => {
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
  }, [userKey]);

  const handleDelete = useCallback(async (taskId: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from("user_personal_tasks").delete().eq("id", taskId);
    if (!error) setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <RequireAuth>
      <>
        <Header navigationItems={navigationItems} />
        <main className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Tasklarım</h1>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="md:col-span-1">
                <div className="rounded-2xl border border-gray-200/70 bg-white p-5 shadow-sm dark:border-gray-800/70 dark:bg-gray-900">
                  <h2 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">Yeni Task</h2>
                  <PersonalTaskForm onCreate={handleCreate} />
                </div>
              </div>
              <div className="md:col-span-2">
                {loading ? (
                  <div className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
                ) : (
                  <PersonalTaskList tasks={tasks} onDelete={handleDelete} />)
                }
              </div>
            </div>
          </div>
        </main>
        <Footer navigationItems={navigationItems} />
      </>
    </RequireAuth>
  );
}


