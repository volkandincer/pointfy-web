/**
 * Task Repository Interface
 * Domain layer abstraction for task data access
 */

import type { Task } from "../entities/Task";

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByRoomId(roomId: string): Promise<Task[]>;
  create(task: Omit<Task, "id" | "createdAt" | "updatedAt">): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    onInsert: (task: Task) => void,
    onUpdate: (task: Task) => void,
    onDelete: (id: string) => void
  ): () => void;
}

