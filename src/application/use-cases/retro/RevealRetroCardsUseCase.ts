/**
 * Reveal RetroCards Use Case
 * Application layer use case for revealing retro cards
 */

import type { IRetroCardRepository } from "../../../domain/repositories/IRetroCardRepository";

export class RevealRetroCardsUseCase {
  constructor(private retroCardRepository: IRetroCardRepository) {}

  async executeAll(roomId: string): Promise<void> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    await this.retroCardRepository.revealAll(roomId);
  }

  async executeById(cardId: string): Promise<void> {
    if (!cardId || cardId.trim().length === 0) {
      throw new Error("Card ID is required");
    }

    await this.retroCardRepository.revealById(cardId);
  }
}

