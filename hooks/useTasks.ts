"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface UseTasksResult {
  tasks: TaskInfo[];
  loading: boolean;
  error: string | null;
  refreshTasks: () => Promise<void>;
}

export function useTasks(roomId: string): UseTasksResult {
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!roomId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data, error: dbError } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });
      if (dbError) {
        setError(dbError.message);
        setTasks([]);
      } else {
        setTasks(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const refreshTasks = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (!roomId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    fetchTasks();
    const supabase = getSupabase();
    const channel = supabase.channel("tasks-room-" + roomId).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: any) => {
        if (!mounted) return;
        switch (payload.eventType) {
          case "INSERT":
            setTasks((prev) => [...prev, payload.new]);
            break;
          case "UPDATE":
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? payload.new : task
              )
            );
            break;
          case "DELETE":
            setTasks((prev) =>
              prev.filter((task) => task.id !== payload.old.id)
            );
            break;
          default:
            fetchTasks();
            break;
        }
      }
    );
    channel.subscribe();
    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId, fetchTasks]);

  return { tasks, loading, error, refreshTasks };
}
