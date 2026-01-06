/**
 * Get Active RetroSession Use Case
 * Application layer use case for getting or creating an active retro session
 */

import type { IRetroSessionRepository } from "../../../domain/repositories/IRetroSessionRepository";
import type { RetroSession } from "../../../domain/entities/RetroSession";

export class GetActiveRetroSessionUseCase {
  constructor(private retroSessionRepository: IRetroSessionRepository) {}

  async execute(roomId: string, createIfNotExists: boolean = true): Promise<RetroSession | null> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    // Aktif session'ı bul
    let activeSession = await this.retroSessionRepository.findActiveByRoomId(roomId);

    // Yoksa ve createIfNotExists true ise oluştur
    if (!activeSession && createIfNotExists) {
      activeSession = await this.retroSessionRepository.create(roomId);
    }

    return activeSession;
  }
}

