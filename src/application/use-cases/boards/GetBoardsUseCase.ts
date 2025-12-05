/**
 * GetBoardsUseCase
 * Fetches all boards for a user
 */

import type { IBoardRepository } from "../../../domain/repositories/IBoardRepository";
import type { Board } from "../../../domain/entities/Board";

export class GetBoardsUseCase {
  constructor(private boardRepository: IBoardRepository) {}

  async execute(userId: string, includeArchived: boolean = false): Promise<Board[]> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    return this.boardRepository.findByUserId(userId, includeArchived);
  }
}

