/**
 * useActiveTask Hook
 * Presentation layer hook for managing active task using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { TaskInfo } from "@/interfaces/Voting.interface";
import { container } from "../../infrastructure/di/Container";
import { TaskAdapter } from "../adapters/TaskAdapter";

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
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const getActiveTaskUseCase = UseCaseFactory.getActiveTask();
        const fetchedTask = await getActiveTaskUseCase.execute(roomId);

        if (!mounted) return;
        setActiveTask(fetchedTask ? TaskAdapter.toPresentation(fetchedTask) : null);
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const taskRepository = container.getTaskRepository();
        unsubscribe = taskRepository.subscribe(
          roomId,
          (newTask) => {
            if (!mounted) return;
            if (newTask.status === "active") {
              setActiveTask(TaskAdapter.toPresentation(newTask));
            }
          },
          (updatedTask) => {
            if (!mounted) return;
            if (updatedTask.status === "active") {
              setActiveTask(TaskAdapter.toPresentation(updatedTask));
            } else {
              // Eğer task artık active değilse, null yap
              setActiveTask((prev) => {
                if (prev && prev.id === updatedTask.id) {
                  return null;
                }
                return prev;
              });
            }
          },
          (deletedId) => {
            if (!mounted) return;
            setActiveTask((prev) => (prev && prev.id === deletedId ? null : prev));
          }
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [roomId]);

  return { activeTask, loading, error };
}

