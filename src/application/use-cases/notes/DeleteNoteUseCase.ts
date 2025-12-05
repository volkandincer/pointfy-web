/**
 * Delete Note Use Case
 * Application layer use case for deleting a note
 */

import type { INoteRepository } from "../../../domain/repositories/INoteRepository";

export class DeleteNoteUseCase {
  constructor(private noteRepository: INoteRepository) {}

  async execute(noteId: string): Promise<void> {
    if (!noteId || noteId.trim().length === 0) {
      throw new Error("Note ID is required");
    }

    const note = await this.noteRepository.findById(noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    await this.noteRepository.delete(noteId);
  }
}

