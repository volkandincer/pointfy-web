/**
 * Update Note Use Case
 * Application layer use case for updating an existing note
 */

import type { INoteRepository } from "../../../domain/repositories/INoteRepository";
import type { Note } from "../../../domain/entities/Note";

export interface UpdateNoteDTO {
  noteId: string;
  content?: string;
  category?: string;
  boardId?: string | null;
}

export class UpdateNoteUseCase {
  constructor(private noteRepository: INoteRepository) {}

  async execute(dto: UpdateNoteDTO): Promise<Note> {
    const note = await this.noteRepository.findById(dto.noteId);
    if (!note) {
      throw new Error("Note not found");
    }

    if (dto.content !== undefined) {
      note.updateContent(dto.content);
    }

    if (dto.category !== undefined) {
      note.updateCategory(dto.category);
    }

    if (dto.boardId !== undefined) {
      if (dto.boardId) {
        note.assignToBoard(dto.boardId);
      } else {
        note.removeFromBoard();
      }
    }

    return this.noteRepository.update(note);
  }
}

