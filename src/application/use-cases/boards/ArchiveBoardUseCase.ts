/**
 * ArchiveBoardUseCase
 * Archives or unarchives a board
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";
import type { Board } from "../../../domain/entities/Board";

export interface ArchiveBoardDTO {
  boardId: string;
  archived: boolean;
}

export class ArchiveBoardUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(dto: ArchiveBoardDTO): Promise<Board> {
    if (!dto.boardId || dto.boardId.trim().length === 0) {
      throw new Error("Board ID is required");
    }

    const board = await this.boardRepository.findById(dto.boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    if (dto.archived) {
      board.archive();
    } else {
      board.unarchive();
    }

    return this.boardRepository.update(board);
  }
}

