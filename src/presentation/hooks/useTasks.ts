/**
 * useTasks Hook
 * Presentation layer hook for managing tasks using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { Task as DomainTask } from "../../domain/entities/Task";
import type { TaskInfo } from "@/interfaces/Voting.interface";
import { container } from "../../infrastructure/di/Container";
import { TaskAdapter } from "../adapters/TaskAdapter";

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
      const getTasksUseCase = UseCaseFactory.getTasks();
      const fetchedTasks = await getTasksUseCase.execute(roomId);
      setTasks(TaskAdapter.toPresentationArray(fetchedTasks));
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
    
    // Realtime subscription - repository üzerinden
    const taskRepository = container.getTaskRepository();
    const unsubscribe = taskRepository.subscribe(
      roomId,
      (newTask: DomainTask) => {
        if (!mounted) return;
        const presentationTask = TaskAdapter.toPresentation(newTask);
        setTasks((prev) => {
          const exists = prev.some((t) => t.id === presentationTask.id);
          if (exists) return prev;
          return [...prev, presentationTask];
        });
      },
      (updatedTask: DomainTask) => {
        if (!mounted) return;
        const presentationTask = TaskAdapter.toPresentation(updatedTask);
        setTasks((prev) =>
          prev.map((t) => (t.id === presentationTask.id ? presentationTask : t))
        );
      },
      (deletedId: string) => {
        if (!mounted) return;
        setTasks((prev) => prev.filter((t) => t.id !== deletedId));
      }
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [roomId, fetchTasks]);

  return { tasks, loading, error, refreshTasks };
}

