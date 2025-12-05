/**
 * GetActiveTaskUseCase
 * Fetches the active task for a room
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { Task } from "../../../domain/entities/Task";

export class GetActiveTaskUseCase {
  constructor(private taskRepository: ITaskRepository) {}

  async execute(roomId: string): Promise<Task | null> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    const tasks = await this.taskRepository.findByRoomId(roomId);
    const activeTask = tasks.find((task) => task.status === "active");
    return activeTask || null;
  }
}

