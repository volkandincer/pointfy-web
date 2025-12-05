/**
 * Get RetroActionItems Use Case
 * Application layer use case for retrieving retro action items
 */

import type { IRetroActionItemRepository } from "../../../domain/repositories/IRetroActionItemRepository";
import type { RetroActionItem } from "../../../domain/entities/RetroActionItem";

export class GetRetroActionItemsUseCase {
  constructor(private retroActionItemRepository: IRetroActionItemRepository) {}

  async execute(roomId: string): Promise<RetroActionItem[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return this.retroActionItemRepository.findByRoomId(roomId);
  }
}

