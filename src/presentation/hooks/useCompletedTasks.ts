/**
 * useCompletedTasks Hook
 * Presentation layer hook for managing completed tasks using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { TaskInfo } from "@/interfaces/Voting.interface";
import { container } from "../../infrastructure/di/Container";
import { TaskAdapter } from "../adapters/TaskAdapter";

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

  useEffect(() => {
    if (!roomId) {
      setCompletedTasks([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const getCompletedTasksUseCase = UseCaseFactory.getCompletedTasks();
        const fetchedTasksWithStats = await getCompletedTasksUseCase.execute(roomId);

        if (!mounted) return;

        // Convert to presentation format
        const presentationTasks: CompletedTask[] = fetchedTasksWithStats.map(
          ({ task, averagePoint, totalVotes, highestPoint, lowestPoint }) => {
            const taskInfo = TaskAdapter.toPresentation(task);
            return {
              ...taskInfo,
              averagePoint,
              totalVotes,
              highestPoint,
              lowestPoint,
            };
          }
        );

        setCompletedTasks(presentationTasks);
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const taskRepository = container.getTaskRepository();
        unsubscribe = taskRepository.subscribe(
          roomId,
          (newTask) => {
            if (!mounted) return;
            if (newTask.status === "completed") {
              // Re-fetch to get vote statistics
              getCompletedTasksUseCase
                .execute(roomId)
                .then((updatedTasksWithStats) => {
                  if (!mounted) return;
                  const updatedPresentationTasks: CompletedTask[] =
                    updatedTasksWithStats.map(
                      ({ task, averagePoint, totalVotes, highestPoint, lowestPoint }) => {
                        const taskInfo = TaskAdapter.toPresentation(task);
                        return {
                          ...taskInfo,
                          averagePoint,
                          totalVotes,
                          highestPoint,
                          lowestPoint,
                        };
                      }
                    );
                  setCompletedTasks(updatedPresentationTasks);
                });
            }
          },
          (updatedTask) => {
            if (!mounted) return;
            if (updatedTask.status === "completed") {
              // Re-fetch to get vote statistics
              getCompletedTasksUseCase
                .execute(roomId)
                .then((updatedTasksWithStats) => {
                  if (!mounted) return;
                  const updatedPresentationTasks: CompletedTask[] =
                    updatedTasksWithStats.map(
                      ({ task, averagePoint, totalVotes, highestPoint, lowestPoint }) => {
                        const taskInfo = TaskAdapter.toPresentation(task);
                        return {
                          ...taskInfo,
                          averagePoint,
                          totalVotes,
                          highestPoint,
                          lowestPoint,
                        };
                      }
                    );
                  setCompletedTasks(updatedPresentationTasks);
                });
            } else {
              // Eğer task artık completed değilse, listeden çıkar
              setCompletedTasks((prev) =>
                prev.filter((t) => t.id !== updatedTask.id)
              );
            }
          },
          (deletedId) => {
            if (!mounted) return;
            setCompletedTasks((prev) => prev.filter((t) => t.id !== deletedId));
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

  return { completedTasks, loading, error };
}
