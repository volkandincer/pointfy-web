/**
 * Update RetroActionItem Use Case
 * Application layer use case for updating a retro action item
 */

import type { IRetroActionItemRepository } from "../../../domain/repositories/IRetroActionItemRepository";
import type { RetroActionItem, RetroActionItemFlag } from "../../../domain/entities/RetroActionItem";

export interface UpdateRetroActionItemDTO {
  itemId: string;
  content?: string;
  isCompleted?: boolean;
  flag?: RetroActionItemFlag | null;
  customFlag?: string;
}

export class UpdateRetroActionItemUseCase {
  constructor(private retroActionItemRepository: IRetroActionItemRepository) {}

  async execute(dto: UpdateRetroActionItemDTO): Promise<RetroActionItem> {
    const item = await this.retroActionItemRepository.findById(dto.itemId);
    if (!item) {
      throw new Error("Retro action item not found");
    }

    if (dto.content !== undefined) {
      item.updateContent(dto.content);
    }

    if (dto.isCompleted !== undefined) {
      if (dto.isCompleted) {
        item.markAsCompleted();
      } else {
        item.markAsIncomplete();
      }
    }

    if (dto.flag !== undefined) {
      if (dto.flag === "custom" && dto.customFlag) {
        item.setCustomFlag(dto.customFlag);
      } else {
        item.setFlag(dto.flag);
      }
    }

    return this.retroActionItemRepository.update(item);
  }
}

