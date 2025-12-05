/**
 * Get Room Use Case
 * Application layer use case for retrieving a room
 */

import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";
import type { Room } from "../../../domain/entities/Room";

export class GetRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async executeById(roomId: string): Promise<Room | null> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return this.roomRepository.findById(roomId);
  }

  async executeByCode(roomCode: string): Promise<Room | null> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new Error("Room code is required");
    }

    return this.roomRepository.findByCode(roomCode);
  }
}

