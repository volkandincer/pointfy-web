/**
 * Get Notes Use Case
 * Application layer use case for retrieving user notes
 */

import type { INoteRepository } from "../../../domain/repositories/INoteRepository";
import type { Note } from "../../../domain/entities/Note";

export class GetNotesUseCase {
  constructor(private noteRepository: INoteRepository) {}

  async execute(userId: string): Promise<Note[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    return this.noteRepository.findByUserId(userId);
  }
}

