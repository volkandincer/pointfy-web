/**
 * Get Tasks Use Case
 * Application layer use case for retrieving tasks
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { Task } from "../../../domain/entities/Task";

export class GetTasksUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(roomId: string): Promise<Task[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return this.taskRepository.findByRoomId(roomId);
  }
}

