/**
 * Vote Repository Interface
 * Domain layer abstraction for vote data access
 */

import type { Vote } from "../entities/Vote";

export interface IVoteRepository {
  findById(id: string): Promise<Vote | null>;
  findByTaskId(taskId: string): Promise<Vote[]>;
  findByRoomId(roomId: string): Promise<Vote[]>;
  findByUserIdAndTaskId(userId: string, taskId: string): Promise<Vote | null>;
  create(vote: Omit<Vote, "id" | "createdAt">): Promise<Vote>;
  update(vote: Vote): Promise<Vote>;
  delete(id: string): Promise<void>;
  
  // Vote-specific operations
  upsert(vote: Omit<Vote, "id" | "createdAt">): Promise<Vote>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    taskId: string,
    onInsert: (vote: Vote) => void,
    onUpdate: (vote: Vote) => void,
    onDelete: (id: string) => void
  ): () => void;
}

