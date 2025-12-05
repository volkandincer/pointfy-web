/**
 * UpdateBoardPositionsUseCase
 * Updates positions of multiple boards
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";

export interface UpdateBoardPositionsDTO {
  positions: { id: string; position: number }[];
}

export class UpdateBoardPositionsUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(dto: UpdateBoardPositionsDTO): Promise<void> {
    if (!dto.positions || dto.positions.length === 0) {
      throw new Error("Positions array is required");
    }

    // Update each board's position
    const updatePromises = dto.positions.map(async ({ id, position }) => {
      const board = await this.boardRepository.findById(id);
      if (!board) {
        throw new Error(`Board with ID ${id} not found`);
      }
      board.updatePosition(position);
      return this.boardRepository.update(board);
    });

    await Promise.all(updatePromises);
  }
}

