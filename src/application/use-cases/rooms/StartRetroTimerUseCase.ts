/**
 * StartRetroTimerUseCase
 * Starts a retro timer for a room
 */

import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";

export class StartRetroTimerUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(roomId: string, durationSeconds: number): Promise<void> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (durationSeconds <= 0) {
      throw new Error("Timer duration must be greater than 0");
    }

    await this.roomRepository.startRetroTimer(roomId, durationSeconds);
  }
}

