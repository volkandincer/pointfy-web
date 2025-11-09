"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { TaskInfo } from "@/interfaces/Voting.interface";

interface UseActiveTaskResult {
  activeTask: TaskInfo | null;
  loading: boolean;
  error: string | null;
}

export function useActiveTask(roomId: string): UseActiveTaskResult {
  const [activeTask, setActiveTask] = useState<TaskInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchActiveTask() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data, error: dbError } = await supabase
          .from("tasks")
          .select("*")
          .eq("room_id", roomId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .maybeSingle();

        if (!mounted) return;
        if (dbError && dbError.code !== "PGRST116") {
          setError(dbError.message);
        }
        setActiveTask(data || null);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchActiveTask();
    const supabase = getSupabase();
    // useTasks ile aynı channel adını kullanıyoruz ama farklı bir channel instance oluşturuyoruz
    // Bu sayede her hook kendi subscription'ını yönetir
    const channel = supabase.channel("active-task-room-" + roomId);
    channel.on(
      // @ts-ignore - Supabase channel type inference issue
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: { eventType: string; new?: { id: string; status: string; updated_at: string }; old?: { id: string; status?: string } }) => {
        if (!mounted) return;
        // Task güncellendiğinde veya eklendiğinde aktif task'ı yeniden çek
        // Özellikle status değişikliklerini dinle
        if (
          payload.eventType === "UPDATE" &&
          payload.new &&
          (payload.new.status === "active" ||
            payload.new.status === "completed" ||
            payload.old?.status === "active")
        ) {
          fetchActiveTask();
        } else if (payload.eventType === "INSERT" && payload.new && payload.new.status === "active") {
          // Yeni task active olarak eklendiyse güncelle
          fetchActiveTask();
        } else if (payload.eventType === "DELETE") {
          // Task silindiyse güncelle
          fetchActiveTask();
        }
      }
    );
    channel.subscribe();
    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId]);

  return { activeTask, loading, error };
}
