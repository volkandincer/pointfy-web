"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

interface CompletedTask {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  created_by_username?: string;
  averagePoint: number;
  totalVotes: number;
  highestPoint: number;
  lowestPoint: number;
}

interface UseCompletedTasksResult {
  completedTasks: CompletedTask[];
  loading: boolean;
  error: string | null;
}

export function useCompletedTasks(roomId: string): UseCompletedTasksResult {
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompletedTasks = useCallback(async () => {
    if (!roomId) {
      setCompletedTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabase();
      const { data: tasks, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("room_id", roomId)
        .eq("status", "completed")
        .order("updated_at", { ascending: false });

      if (tasksError) {
        setError(tasksError.message);
        setCompletedTasks([]);
      } else {
        const tasksWithStats = await Promise.all(
          (tasks || []).map(async (task) => {
            const { data: votes } = await supabase
              .from("votes")
              .select("point")
              .eq("task_id", task.id)
              .not("point", "is", null);

            const validPoints = (votes || [])
              .map((v) => v.point)
              .filter((p): p is number => p !== null && p !== undefined);

            return {
              id: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              created_at: task.created_at,
              updated_at: task.updated_at,
              created_by_username: task.created_by_username,
              averagePoint:
                validPoints.length > 0
                  ? Math.round(
                      validPoints.reduce((sum, p) => sum + p, 0) /
                        validPoints.length
                    )
                  : 0,
              totalVotes: validPoints.length,
              highestPoint:
                validPoints.length > 0 ? Math.max(...validPoints) : 0,
              lowestPoint:
                validPoints.length > 0 ? Math.min(...validPoints) : 0,
            };
          })
        );
        setCompletedTasks(tasksWithStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setCompletedTasks([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setCompletedTasks([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    fetchCompletedTasks();
    const supabase = getSupabase();
    const channel = supabase.channel("completed-tasks-" + roomId).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: any) => {
        if (!mounted) return;
        if (
          payload.eventType === "UPDATE" &&
          payload.new.status === "completed"
        ) {
          fetchCompletedTasks();
        } else if (
          payload.eventType === "INSERT" &&
          payload.new.status === "completed"
        ) {
          fetchCompletedTasks();
        } else if (payload.eventType === "DELETE") {
          fetchCompletedTasks();
        }
      }
    );
    channel.subscribe();
    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId, fetchCompletedTasks]);

  return { completedTasks, loading, error };
}
