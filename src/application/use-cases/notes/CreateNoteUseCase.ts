/**
 * Create Note Use Case
 * Application layer use case for creating a new note
 */

import type { INoteRepository } from "../../../domain/repositories/INoteRepository";
import type { Note } from "../../../domain/entities/Note";

export interface CreateNoteDTO {
  userId: string;
  content: string;
  category: string;
  boardId?: string | null;
}

export class CreateNoteUseCase {
  constructor(private noteRepository: INoteRepository) {}

  async execute(dto: CreateNoteDTO): Promise<Note> {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Note content cannot be empty");
    }
    if (!dto.category || dto.category.trim().length === 0) {
      throw new Error("Note category is required");
    }

    return this.noteRepository.create({
      userId: dto.userId,
      content: dto.content.trim(),
      category: dto.category.trim(),
      boardId: dto.boardId || null,
    });
  }
}

