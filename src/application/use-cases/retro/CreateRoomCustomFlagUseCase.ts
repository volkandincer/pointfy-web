/**
 * CreateRoomCustomFlagUseCase
 * Creates a new custom flag for a retro room
 */

import type { IRoomCustomFlagRepository } from "../../../domain/repositories/IRoomCustomFlagRepository";
import type { RoomCustomFlag } from "../../../domain/entities/RoomCustomFlag";

export interface CreateRoomCustomFlagDTO {
  roomId: string;
  flagName: string;
  flagColor?: string;
  createdBy: string;
}

export class CreateRoomCustomFlagUseCase {
  constructor(private roomCustomFlagRepository: IRoomCustomFlagRepository) {}

  async execute(data: CreateRoomCustomFlagDTO): Promise<RoomCustomFlag> {
    if (!data.roomId || data.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (!data.flagName || data.flagName.trim().length === 0) {
      throw new Error("Flag name is required");
    }

    if (!data.createdBy || data.createdBy.trim().length === 0) {
      throw new Error("Created by is required");
    }

    return await this.roomCustomFlagRepository.create({
      roomId: data.roomId,
      flagName: data.flagName,
      flagColor: data.flagColor || "#6B7280",
      createdBy: data.createdBy,
    });
  }
}

