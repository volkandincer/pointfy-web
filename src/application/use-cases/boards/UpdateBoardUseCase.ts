/**
 * UpdateBoardUseCase
 * Updates an existing board
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";
import type { Board } from "../../../domain/entities/Board";

export interface UpdateBoardDTO {
  boardId: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
}

export class UpdateBoardUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(dto: UpdateBoardDTO): Promise<Board> {
    if (!dto.boardId || dto.boardId.trim().length === 0) {
      throw new Error("Board ID is required");
    }

    const board = await this.boardRepository.findById(dto.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    if (dto.name !== undefined) {
      board.updateName(dto.name);
    }
    if (dto.description !== undefined) {
      board.updateDescription(dto.description);
    }
    if (dto.color !== undefined) {
      board.setColor(dto.color);
    }
    if (dto.icon !== undefined) {
      board.setIcon(dto.icon);
    }
    if (dto.position !== undefined) {
      board.updatePosition(dto.position);
    }

    return this.boardRepository.update(board);
  }
}

