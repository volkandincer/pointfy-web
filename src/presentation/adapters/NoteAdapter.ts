/**
 * Note Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { Note as DomainNote } from "../../domain/entities/Note";
import type { Note as PresentationNote } from "@/interfaces/Note.interface";

export class NoteAdapter {
  /**
   * Convert domain Note to presentation Note interface
   */
  static toPresentation(note: DomainNote): PresentationNote {
    return {
      id: note.id,
      user_key: note.userId,
      content: note.content,
      category: note.category,
      board_id: note.boardId,
      created_at: note.createdAt.toISOString(),
      updated_at: note.updatedAt.toISOString(),
      createdAt: note.createdAt.getTime(),
    };
  }

  /**
   * Convert presentation Note interface to domain Note
   */
  static toDomain(note: PresentationNote): DomainNote {
    return DomainNote.fromRow({
      id: note.id,
      user_key: note.user_key,
      content: note.content,
      category: note.category,
      board_id: note.board_id || null,
      created_at: note.created_at || new Date().toISOString(),
      updated_at: note.updated_at || new Date().toISOString(),
    });
  }

  /**
   * Convert array of domain Notes to presentation Notes
   */
  static toPresentationArray(notes: DomainNote[]): PresentationNote[] {
    return notes.map((note) => this.toPresentation(note));
  }

  /**
   * Convert array of presentation Notes to domain Notes
   */
  static toDomainArray(notes: PresentationNote[]): DomainNote[] {
    return notes.map((note) => this.toDomain(note));
  }
}

