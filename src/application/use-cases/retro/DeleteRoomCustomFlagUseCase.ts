/**
 * DeleteRoomCustomFlagUseCase
 * Deletes a custom flag from a retro room
 */

import type { IRoomCustomFlagRepository } from "../../../domain/repositories/IRoomCustomFlagRepository";

export class DeleteRoomCustomFlagUseCase {
  constructor(private roomCustomFlagRepository: IRoomCustomFlagRepository) {}

  async execute(flagId: string): Promise<void> {
    if (!flagId || flagId.trim().length === 0) {
      throw new Error("Flag ID is required");
    }

    await this.roomCustomFlagRepository.delete(flagId);
  }
}

