/**
 * GetCompletedTasksUseCase
 * Fetches completed tasks for a room with vote statistics
 */

import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { IVoteRepository } from "../../../domain/repositories/IVoteRepository";
import type { Task } from "../../../domain/entities/Task";

export interface CompletedTaskWithStats {
  task: Task;
  averagePoint: number;
  totalVotes: number;
  highestPoint: number;
  lowestPoint: number;
}

export class GetCompletedTasksUseCase {
  constructor(
    private taskRepository: ITaskRepository,
    private voteRepository: IVoteRepository
  ) {}

  async execute(roomId: string): Promise<CompletedTaskWithStats[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    const tasks = await this.taskRepository.findByRoomId(roomId);
    const completedTasks = tasks.filter((task) => task.status === "completed");

    // Get vote statistics for each completed task
    const tasksWithStats = await Promise.all(
      completedTasks.map(async (task) => {
        const votes = await this.voteRepository.findByTaskId(task.id);
        const validPoints = votes
          .map((v) => v.point)
          .filter((p): p is number => p !== null && p !== undefined);

        return {
          task,
          averagePoint:
            validPoints.length > 0
              ? Math.round(
                  validPoints.reduce((sum, p) => sum + p, 0) / validPoints.length
                )
              : 0,
          totalVotes: validPoints.length,
          highestPoint: validPoints.length > 0 ? Math.max(...validPoints) : 0,
          lowestPoint: validPoints.length > 0 ? Math.min(...validPoints) : 0,
        };
      })
    );

    return tasksWithStats;
  }
}
