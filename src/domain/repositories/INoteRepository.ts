/**
 * Note Repository Interface
 * Domain layer abstraction for note data access
 */

import type { Note } from "../entities/Note";

export interface INoteRepository {
  findById(id: string): Promise<Note | null>;
  findByUserId(userId: string): Promise<Note[]>;
  findByBoardId(boardId: string): Promise<Note[]>;
  create(note: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note>;
  update(note: Note): Promise<Note>;
  delete(id: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    userId: string,
    onInsert: (note: Note) => void,
    onUpdate: (note: Note) => void,
    onDelete: (id: string) => void
  ): () => void;
}

