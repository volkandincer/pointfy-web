/**
 * StopRetroTimerUseCase
 * Stops a retro timer for a room
 */

import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";

export class StopRetroTimerUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(roomId: string): Promise<void> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    await this.roomRepository.stopRetroTimer(roomId);
  }
}

