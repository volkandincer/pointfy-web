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
          
          // Task'ın başlangıç zamanını kullanarak gerçek kalan süreyi hesapla
          const taskStartTime = new Date(activeTask.updated_at).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - taskStartTime) / 1000);
          const totalDuration = 60; // 60 saniye
          let timeLeft = Math.max(0, totalDuration - elapsedSeconds);
          
          setRemainingTime(timeLeft);

          timer = setInterval(() => {
            // Her saniye gerçek kalan süreyi yeniden hesapla
            const currentTime = Date.now();
            const currentElapsed = Math.floor((currentTime - taskStartTime) / 1000);
            timeLeft = Math.max(0, totalDuration - currentElapsed);
            
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
      (payload: { eventType: string; new?: { id: string; status: string; updated_at: string }; old?: { id: string } }) => {
        if (payload.eventType === "UPDATE" && payload.new.status === "active") {
          // Yeni active task - timer'ı başlat (updated_at zamanını kullanarak)
          if (timer) clearInterval(timer);
          
          const taskStartTime = new Date(payload.new.updated_at).getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - taskStartTime) / 1000);
          const totalDuration = 60;
          let timeLeft = Math.max(0, totalDuration - elapsedSeconds);
          
          setIsVotingActive(true);
          setRemainingTime(timeLeft);
          
          timer = setInterval(() => {
            const currentTime = Date.now();
            const currentElapsed = Math.floor((currentTime - taskStartTime) / 1000);
            timeLeft = Math.max(0, totalDuration - currentElapsed);
            
            if (timeLeft <= 0) {
              setIsVotingActive(false);
              setRemainingTime(0);
              const supabase = getSupabase();
              supabase
                .from("tasks")
                .update({ status: "pending" })
                .eq("id", payload.new.id)
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
