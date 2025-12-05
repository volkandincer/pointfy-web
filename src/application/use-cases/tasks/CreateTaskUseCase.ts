/**
 * Create Task Use Case
 * Application layer use case for creating a new task
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { Task, TaskStatus } from "../../../domain/entities/Task";

export interface CreateTaskDTO {
  roomId: string;
  title: string;
  description?: string;
  createdBy: string;
  createdByUsername?: string;
  status?: TaskStatus;
  jiraKey?: string;
  jiraUrl?: string;
  jiraId?: string;
}

export class CreateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(dto: CreateTaskDTO): Promise<Task> {
    if (!dto.roomId || dto.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }
    if (!dto.title || dto.title.trim().length === 0) {
      throw new Error("Task title cannot be empty");
    }
    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      throw new Error("Created by user ID is required");
    }

    return this.taskRepository.create({
      roomId: dto.roomId,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      status: dto.status || "active",
      createdBy: dto.createdBy,
      createdByUsername: dto.createdByUsername || null,
      jiraKey: dto.jiraKey || null,
      jiraUrl: dto.jiraUrl || null,
      jiraId: dto.jiraId || null,
    });
  }
}

