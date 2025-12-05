/**
 * Update Task Use Case
 * Application layer use case for updating a task
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { Task, TaskStatus } from "../../../domain/entities/Task";

export interface UpdateTaskDTO {
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  jiraKey?: string;
  jiraUrl?: string;
  jiraId?: string;
}

export class UpdateTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(dto: UpdateTaskDTO): Promise<Task> {
    const task = await this.taskRepository.findById(dto.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    if (dto.title !== undefined) {
      task.updateTitle(dto.title);
    }

    if (dto.description !== undefined) {
      task.updateDescription(dto.description);
    }

    if (dto.status !== undefined) {
      switch (dto.status) {
        case "completed":
          task.markAsCompleted();
          break;
        case "active":
          task.markAsActive();
          break;
        case "pending":
          task.markAsPending();
          break;
      }
    }

    if (dto.jiraKey && dto.jiraUrl && dto.jiraId) {
      task.linkToJira(dto.jiraKey, dto.jiraUrl, dto.jiraId);
    } else if (dto.jiraKey === null) {
      task.unlinkFromJira();
    }

    return this.taskRepository.update(task);
  }
}

