/**
 * GetVotesUseCase
 * Fetches votes for a task with visibility rules
 */

import type { IVoteRepository } from "../../../domain/repositories/IVoteRepository";
import type { ITaskRepository } from "../../../domain/repositories/ITaskRepository";
import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";
import type { Vote } from "../../../domain/entities/Vote";
import { getSupabase } from "@/lib/supabase";

export interface GetVotesDTO {
  roomId: string;
  taskId: string;
  isRevealed: boolean;
  currentUserId?: string;
}

export class GetVotesUseCase {
  constructor(
    private voteRepository: IVoteRepository,
    private taskRepository: ITaskRepository,
    private roomRepository: IRoomRepository
  ) {}

  async execute(dto: GetVotesDTO): Promise<Vote[]> {
    if (!dto.roomId || dto.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (!dto.taskId || dto.taskId.trim().length === 0) {
      throw new Error("Task ID is required");
    }

    const task = await this.taskRepository.findById(dto.taskId);
    if (!task) {
      throw new Error("Task not found");
    }

    const shouldShowAllVotes = dto.isRevealed || task.status === "completed";

    if (shouldShowAllVotes) {
      return this.voteRepository.findByTaskId(dto.taskId);
    }

    if (!dto.currentUserId) {
      return [];
    }

    const ownVote = await this.voteRepository.findByUserIdAndTaskId(
      dto.currentUserId,
      dto.taskId
    );

    const room = await this.roomRepository.findById(dto.roomId);
    if (!room) {
      return ownVote ? [ownVote] : [];
    }

    const supabase = getSupabase();
    const { data: participant } = await supabase
      .from("room_participants")
      .select("is_admin")
      .eq("room_code", room.code)
      .eq("user_key", dto.currentUserId)
      .single();

    if (participant?.is_admin) {
      return this.voteRepository.findByTaskId(dto.taskId);
    }

    return ownVote ? [ownVote] : [];
  }
}

