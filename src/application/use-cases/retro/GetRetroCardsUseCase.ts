/**
 * Get RetroCards Use Case
 * Application layer use case for retrieving retro cards
 */

import type { IRetroCardRepository } from "../../../domain/repositories/IRetroCardRepository";
import type { IRetroSessionRepository } from "../../../domain/repositories/IRetroSessionRepository";
import type { RetroCard, RetroCategory } from "../../../domain/entities/RetroCard";

export class GetRetroCardsUseCase {
  constructor(
    private retroCardRepository: IRetroCardRepository,
    private retroSessionRepository: IRetroSessionRepository
  ) {}

  async execute(roomId: string): Promise<RetroCard[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    // Aktif session'ı bul
    const activeSession = await this.retroSessionRepository.findActiveByRoomId(roomId);
    
    // Aktif session varsa sadece o session'a ait kartları getir
    if (activeSession) {
      return this.retroCardRepository.findBySessionId(activeSession.id);
    }

    // Aktif session yoksa boş array döndür (tamamlanmış session'ların kartları gösterilmesin)
    return [];
  }

  async executeByCategory(roomId: string, category: RetroCategory): Promise<RetroCard[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    // Aktif session'ı bul
    const activeSession = await this.retroSessionRepository.findActiveByRoomId(roomId);
    
    // Aktif session varsa sadece o session'a ait kartları getir ve filtrele
    if (activeSession) {
      const sessionCards = await this.retroCardRepository.findBySessionId(activeSession.id);
      return sessionCards.filter((card) => card.category === category);
    }

    // Aktif session yoksa boş array döndür (tamamlanmış session'ların kartları gösterilmesin)
    return [];
  }
}

