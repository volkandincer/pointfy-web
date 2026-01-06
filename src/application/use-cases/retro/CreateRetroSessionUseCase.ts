/**
 * Create RetroSession Use Case
 * Application layer use case for creating a new retro session
 */

import type { IRetroSessionRepository } from "../../../domain/repositories/IRetroSessionRepository";
import type { RetroSession } from "../../../domain/entities/RetroSession";

export class CreateRetroSessionUseCase {
  constructor(private retroSessionRepository: IRetroSessionRepository) {}

  async execute(roomId: string): Promise<RetroSession> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    // Repository'de zaten aktif session kontrolü ve tamamlama yapılıyor
    return await this.retroSessionRepository.create(roomId);
  }
}

