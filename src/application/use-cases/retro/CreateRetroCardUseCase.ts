/**
 * Create RetroCard Use Case
 * Application layer use case for creating a retro card
 */

import type { IRetroCardRepository } from "../../../domain/repositories/IRetroCardRepository";
import type { IRetroSessionRepository } from "../../../domain/repositories/IRetroSessionRepository";
import type { RetroCard, RetroCategory } from "../../../domain/entities/RetroCard";

export interface CreateRetroCardDTO {
  roomId: string;
  userId: string;
  userName: string;
  category: RetroCategory;
  content: string;
}

export class CreateRetroCardUseCase {
  constructor(
    private retroCardRepository: IRetroCardRepository,
    private retroSessionRepository: IRetroSessionRepository
  ) {}

  async execute(dto: CreateRetroCardDTO): Promise<RetroCard> {
    if (!dto.roomId || dto.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }
    if (!dto.userId || dto.userId.trim().length === 0) {
      throw new Error("User ID is required");
    }
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Card content cannot be empty");
    }
    if (!["mad", "sad", "glad"].includes(dto.category)) {
      throw new Error("Invalid retro category");
    }

    // Aktif session'ı bul veya oluştur
    let activeSession = await this.retroSessionRepository.findActiveByRoomId(dto.roomId);
    if (!activeSession) {
      activeSession = await this.retroSessionRepository.create(dto.roomId);
    }

    return this.retroCardRepository.create({
      roomId: dto.roomId,
      userId: dto.userId,
      userName: dto.userName,
      category: dto.category,
      content: dto.content.trim(),
      isRevealed: false,
      retroSessionId: activeSession.id,
    });
  }
}

