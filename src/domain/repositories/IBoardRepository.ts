/**
 * Board Repository Interface
 * Domain layer abstraction for board data access
 */

import type { Board } from "../entities/Board";

export interface IBoardRepository {
  findById(id: string): Promise<Board | null>;
  findByUserId(userId: string, includeArchived?: boolean): Promise<Board[]>;
  create(board: Omit<Board, "id" | "createdAt" | "updatedAt">): Promise<Board>;
  update(board: Board): Promise<Board>;
  delete(id: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    userId: string,
    onInsert: (board: Board) => void,
    onUpdate: (board: Board) => void,
    onDelete: (id: string) => void
  ): () => void;
}

