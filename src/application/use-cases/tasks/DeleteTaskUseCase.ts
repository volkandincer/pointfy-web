/**
 * Delete Task Use Case
 * Application layer use case for deleting a task
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";

export class DeleteTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(taskId: string): Promise<void> {
    if (!taskId || taskId.trim().length === 0) {
      throw new Error("Task ID is required");
    }

    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    await this.taskRepository.delete(taskId);
  }
}

