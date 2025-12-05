/**
 * Create RetroActionItem Use Case
 * Application layer use case for creating a retro action item
 */

import type { IRetroActionItemRepository } from "../../../domain/repositories/IRetroActionItemRepository";
import type { RetroActionItem, RetroActionItemFlag } from "../../../domain/entities/RetroActionItem";

export interface CreateRetroActionItemDTO {
  roomId: string;
  content: string;
  createdBy: string;
  createdByUsername: string;
  flag?: RetroActionItemFlag | null;
  customFlag?: string | null;
}

export class CreateRetroActionItemUseCase {
  constructor(private retroActionItemRepository: IRetroActionItemRepository) {}

  async execute(dto: CreateRetroActionItemDTO): Promise<RetroActionItem> {
    if (!dto.roomId || dto.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }
    if (!dto.content || dto.content.trim().length === 0) {
      throw new Error("Action item content cannot be empty");
    }
    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      throw new Error("Created by user ID is required");
    }

    return this.retroActionItemRepository.create({
      roomId: dto.roomId,
      content: dto.content.trim(),
      createdBy: dto.createdBy,
      createdByUsername: dto.createdByUsername,
      isCompleted: false,
      completedAt: null,
      flag: dto.flag || null,
      customFlag: dto.customFlag || null,
    });
  }
}

