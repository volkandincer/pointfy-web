/**
 * DeleteBoardUseCase
 * Soft deletes a board
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";
import type { Board } from "../../../domain/entities/Board";

export class DeleteBoardUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(boardId: string): Promise<void> {
    if (!boardId || boardId.trim().length === 0) {
      throw new Error("Board ID is required");
    }

    const board = await this.boardRepository.findById(boardId);
    if (!board) {
      throw new Error("Board not found");
    }

    board.delete();
    await this.boardRepository.update(board);
  }
}

