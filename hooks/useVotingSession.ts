"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { VotingSessionState } from "@/interfaces/Voting.interface";

export function useVotingSession(roomId: string): VotingSessionState {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isVotingActive, setIsVotingActive] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function checkActiveTask() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: activeTask, error: dbError } = await supabase
          .from("tasks")
          .select("id, status, updated_at")
          .eq("room_id", roomId)
          .eq("status", "active")
          .maybeSingle();

        if (!mounted) return;

        if (dbError && dbError.code !== "PGRST116") {
          setError(dbError.message);
          setIsVotingActive(false);
          setRemainingTime(0);
        } else if (activeTask) {
          setIsVotingActive(true);
          let timeLeft = 60;
          setRemainingTime(timeLeft);

          timer = setInterval(() => {
            timeLeft--;
            if (timeLeft <= 0) {
              setIsVotingActive(false);
              setRemainingTime(0);
              supabase
                .from("tasks")
                .update({ status: "pending" })
                .eq("id", activeTask.id)
                .then(({ error: error1 }) => {
                  if (error1) {
                    console.error("Task status güncelleme hatası:", error1);
                  }
                });
              if (timer) clearInterval(timer);
            } else {
              setRemainingTime(timeLeft);
            }
          }, 1000);
        } else {
          const { data: completedTask } = await supabase
            .from("tasks")
            .select("id, status")
            .eq("room_id", roomId)
            .eq("status", "completed")
            .order("updated_at", { ascending: false })
            .limit(1);

          if (completedTask && completedTask.length > 0) {
            setIsVotingActive(false);
            setRemainingTime(0);
          } else {
            setIsVotingActive(false);
            setRemainingTime(0);
          }
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Bilinmeyen hata");
          setIsVotingActive(false);
          setRemainingTime(0);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkActiveTask();

    const supabase = getSupabase();
    const channel = supabase.channel("tasks-status-" + roomId).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: any) => {
        if (payload.eventType === "UPDATE" && payload.new.status === "active") {
          if (timer) clearInterval(timer);
          checkActiveTask();
        } else if (
          payload.eventType === "UPDATE" &&
          payload.new.status === "pending"
        ) {
          if (timer) clearInterval(timer);
          setIsVotingActive(false);
          setRemainingTime(0);
        } else if (
          payload.eventType === "UPDATE" &&
          payload.new.status === "completed"
        ) {
          if (timer) clearInterval(timer);
          setIsVotingActive(false);
          setRemainingTime(0);
        }
      }
    );

    channel.subscribe();

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      channel.unsubscribe();
    };
  }, [roomId]);

  return {
    loading,
    error,
    remainingTime,
    isVotingActive,
  };
}
