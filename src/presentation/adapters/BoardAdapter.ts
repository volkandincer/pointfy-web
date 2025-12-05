/**
 * Board Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { Board as DomainBoard } from "../../domain/entities/Board";
import type { Board as PresentationBoard } from "@/interfaces/Board.interface";

export class BoardAdapter {
  /**
   * Convert domain Board to presentation Board interface
   */
  static toPresentation(board: DomainBoard): PresentationBoard {
    return {
      id: board.id,
      user_key: board.userId,
      name: board.name,
      description: board.description,
      color: board.color,
      icon: board.icon,
      position: board.position,
      is_archived: board.isArchived,
      is_deleted: board.isDeleted,
      created_at: board.createdAt.toISOString(),
      updated_at: board.updatedAt.toISOString(),
    };
  }

  /**
   * Convert presentation Board interface to domain Board
   */
  static toDomain(board: PresentationBoard): DomainBoard {
    return DomainBoard.fromRow({
      id: board.id,
      user_key: board.user_key,
      name: board.name,
      description: board.description,
      color: board.color,
      icon: board.icon,
      position: board.position,
      is_archived: board.is_archived,
      is_deleted: board.is_deleted,
      created_at: board.created_at,
      updated_at: board.updated_at,
    });
  }

  /**
   * Convert array of domain Boards to presentation Boards
   */
  static toPresentationArray(boards: DomainBoard[]): PresentationBoard[] {
    return boards.map((board) => this.toPresentation(board));
  }

  /**
   * Convert array of presentation Boards to domain Boards
   */
  static toDomainArray(boards: PresentationBoard[]): DomainBoard[] {
    return boards.map((board) => this.toDomain(board));
  }
}

