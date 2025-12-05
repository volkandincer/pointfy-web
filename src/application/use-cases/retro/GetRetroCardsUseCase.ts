/**
 * Get RetroCards Use Case
 * Application layer use case for retrieving retro cards
 */

import type { IRetroCardRepository } from "../../../domain/repositories/IRetroCardRepository";
import type { RetroCard, RetroCategory } from "../../../domain/entities/RetroCard";

export class GetRetroCardsUseCase {
  constructor(private retroCardRepository: IRetroCardRepository) {}

  async execute(roomId: string): Promise<RetroCard[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return this.retroCardRepository.findByRoomId(roomId);
  }

  async executeByCategory(roomId: string, category: RetroCategory): Promise<RetroCard[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return this.retroCardRepository.findByRoomIdAndCategory(roomId, category);
  }
}

