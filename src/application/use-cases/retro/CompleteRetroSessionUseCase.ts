/**
 * Complete RetroSession Use Case
 * Application layer use case for completing a retro session
 */

import type { IRetroSessionRepository } from "../../../domain/repositories/IRetroSessionRepository";

export class CompleteRetroSessionUseCase {
  constructor(private retroSessionRepository: IRetroSessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    if (!sessionId || sessionId.trim().length === 0) {
      throw new Error("Session ID is required");
    }

    // Session'ı tamamla (SQL function hem session'ı tamamlar hem de aksiyon maddesi olmayan kartları siler)
    await this.retroSessionRepository.completeSession(sessionId);
  }
}

