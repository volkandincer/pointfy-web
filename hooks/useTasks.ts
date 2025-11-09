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
        .select(
          "id, title, description, status, room_id, created_at, updated_at, created_by_username, created_by_key"
        )
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
      (payload: { eventType: string; new?: { id: string; [key: string]: unknown }; old?: { id: string } }) => {
        if (!mounted) return;
        switch (payload.eventType) {
          case "INSERT":
            // Yeni task eklendiğinde listeye ekle
            setTasks((prev) => {
              // Duplicate kontrolü - eğer task zaten varsa ekleme
              const exists = prev.some((task) => task.id === payload.new.id);
              if (exists) return prev;
              return [...prev, payload.new];
            });
            break;
          case "UPDATE":
            // Task güncellendiğinde (özellikle status değişiklikleri)
            setTasks((prev) =>
              prev.map((task) =>
                task.id === payload.new.id ? payload.new : task
              )
            );
            break;
          case "DELETE":
            // Task silindiğinde listeden çıkar
            setTasks((prev) =>
              prev.filter((task) => task.id !== payload.old.id)
            );
            break;
          default:
            // Diğer durumlarda tüm listeyi yeniden çek
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
