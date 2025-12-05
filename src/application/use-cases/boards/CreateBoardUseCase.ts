/**
 * CreateBoardUseCase
 * Creates a new board for a user
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";
import { Board } from "../../../domain/entities/Board";

export interface CreateBoardDTO {
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
}

export class CreateBoardUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(dto: CreateBoardDTO): Promise<Board> {
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error("Board name is required");
    }

    // Get existing boards to determine position
    const existingBoards = await this.boardRepository.findByUserId(dto.userId, false);
    const maxPosition =
      existingBoards.length > 0
        ? Math.max(...existingBoards.map((b) => b.position)) + 1
        : 0;

    const now = new Date();
    const board = new Board(
      crypto.randomUUID(),
      dto.userId,
      dto.name.trim(),
      dto.description?.trim() || null,
      dto.color || null,
      dto.icon || null,
      dto.position !== undefined ? dto.position : maxPosition,
      false, // isArchived
      false, // isDeleted
      now,
      now
    );

    return this.boardRepository.create({
      userId: board.userId,
      name: board.name,
      description: board.description,
      color: board.color,
      icon: board.icon,
      position: board.position,
      isArchived: board.isArchived,
      isDeleted: board.isDeleted,
    });
  }
}

