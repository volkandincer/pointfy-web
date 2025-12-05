/**
 * useVotingSession Hook
 * Presentation layer hook for managing voting session using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import { container } from "../../infrastructure/di/Container";
import type { Task } from "../../domain/entities/Task";
import type { VotingSessionState } from "@/interfaces/Voting.interface";

const VOTING_DURATION_SECONDS = 60; // 60 saniye

export function useVotingSession(roomId: string): VotingSessionState {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isVotingActive, setIsVotingActive] = useState<boolean>(false);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    let mounted = true;
    let timer: NodeJS.Timeout | null = null;

    async function checkActiveTask() {
      setLoading(true);
      setError(null);

      try {
        const getActiveTaskUseCase = UseCaseFactory.getActiveTask();
        const activeTask = await getActiveTaskUseCase.execute(roomId);

        if (!mounted) return;

        if (activeTask && activeTask.status === "active") {
          setIsVotingActive(true);

          // Task'ın başlangıç zamanını kullanarak gerçek kalan süreyi hesapla
          const taskStartTime = activeTask.updatedAt.getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - taskStartTime) / 1000);
          let timeLeft = Math.max(0, VOTING_DURATION_SECONDS - elapsedSeconds);

          setRemainingTime(timeLeft);

          timer = setInterval(() => {
            if (!mounted) return;
            // Her saniye gerçek kalan süreyi yeniden hesapla
            const currentTime = Date.now();
            const currentElapsed = Math.floor((currentTime - taskStartTime) / 1000);
            timeLeft = Math.max(0, VOTING_DURATION_SECONDS - currentElapsed);

            if (timeLeft <= 0) {
              setIsVotingActive(false);
              setRemainingTime(0);
              // Task'ı pending durumuna çevir
              const updateTaskUseCase = UseCaseFactory.updateTask();
              updateTaskUseCase
                .execute({
                  taskId: activeTask.id,
                  status: "pending",
                })
                .catch(() => {
                  // Ignore errors
                });
              if (timer) clearInterval(timer);
              timer = null;
            } else {
              setRemainingTime(timeLeft);
            }
          }, 1000);
        } else {
          setIsVotingActive(false);
          setRemainingTime(0);
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

    // Realtime subscription - repository üzerinden
    const taskRepository = container.getTaskRepository();
    const unsubscribe = taskRepository.subscribe(
      roomId,
      (newTask: Task) => {
        // Yeni task eklendiğinde kontrol et
        if (newTask.status === "active") {
          checkActiveTask();
        }
      },
      (updatedTask: Task) => {
        if (!mounted) return;

        if (updatedTask.status === "active") {
          // Yeni active task - timer'ı başlat
          if (timer) clearInterval(timer);

          const taskStartTime = updatedTask.updatedAt.getTime();
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - taskStartTime) / 1000);
          let timeLeft = Math.max(0, VOTING_DURATION_SECONDS - elapsedSeconds);

          setIsVotingActive(true);
          setRemainingTime(timeLeft);

          timer = setInterval(() => {
            if (!mounted) return;
            const currentTime = Date.now();
            const currentElapsed = Math.floor((currentTime - taskStartTime) / 1000);
            timeLeft = Math.max(0, VOTING_DURATION_SECONDS - currentElapsed);

            if (timeLeft <= 0) {
              setIsVotingActive(false);
              setRemainingTime(0);
              // Task'ı pending durumuna çevir
              const updateTaskUseCase = UseCaseFactory.updateTask();
              updateTaskUseCase
                .execute({
                  taskId: updatedTask.id,
                  status: "pending",
                })
                .catch(() => {
                  // Ignore errors
                });
              if (timer) clearInterval(timer);
              timer = null;
            } else {
              setRemainingTime(timeLeft);
            }
          }, 1000);
        } else if (
          updatedTask.status === "pending" ||
          updatedTask.status === "completed"
        ) {
          if (timer) clearInterval(timer);
          timer = null;
          setIsVotingActive(false);
          setRemainingTime(0);
        }
      },
      () => {
        // Task silindiğinde bir şey yapmaya gerek yok
      }
    );

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
      unsubscribe();
    };
  }, [roomId]);

  return {
    loading,
    error,
    remainingTime,
    isVotingActive,
  };
}

