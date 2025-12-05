/**
 * GetRoomCustomFlagsUseCase
 * Fetches custom flags for a retro room
 */

import type { IRoomCustomFlagRepository } from "../../../domain/repositories/IRoomCustomFlagRepository";
import type { RoomCustomFlag } from "../../../domain/entities/RoomCustomFlag";

export class GetRoomCustomFlagsUseCase {
  constructor(private roomCustomFlagRepository: IRoomCustomFlagRepository) {}

  async execute(roomId: string): Promise<RoomCustomFlag[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    return await this.roomCustomFlagRepository.findByRoomId(roomId);
  }
}

