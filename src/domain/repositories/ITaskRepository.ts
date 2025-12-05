/**
 * Task Repository Interface
 * Domain layer abstraction for task data access
 */

import type { Task, TaskStatus } from "../entities/Task";

export interface CreateTaskData {
  roomId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  createdBy: string;
  jiraKey: string | null;
  jiraUrl: string | null;
  jiraId: string | null;
}

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByRoomId(roomId: string): Promise<Task[]>;
  create(taskData: CreateTaskData): Promise<Task>;
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

