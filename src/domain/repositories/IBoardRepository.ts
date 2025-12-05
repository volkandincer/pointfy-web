/**
 * Board Repository Interface
 * Domain layer abstraction for board data access
 */

import type { Board } from "../entities/Board";

export interface CreateBoardData {
  userId: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  isArchived: boolean;
  isDeleted: boolean;
}

export interface IBoardRepository {
  findById(id: string): Promise<Board | null>;
  findByUserId(userId: string, includeArchived?: boolean): Promise<Board[]>;
  create(boardData: CreateBoardData): Promise<Board>;
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
