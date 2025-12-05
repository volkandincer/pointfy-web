/**
 * Create Room Use Case
 * Application layer use case for creating a new room
 */

import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";
import type { Room, RoomType } from "../../../domain/entities/Room";

export interface CreateRoomDTO {
  name: string;
  createdBy: string;
  roomType: RoomType;
  isPrivate?: boolean;
  password?: string;
}

export class CreateRoomUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(dto: CreateRoomDTO): Promise<Room> {
    if (!dto.name || dto.name.trim().length === 0) {
      throw new Error("Room name cannot be empty");
    }
    if (!dto.createdBy || dto.createdBy.trim().length === 0) {
      throw new Error("Created by user ID is required");
    }

    const room = await this.roomRepository.create({
      name: dto.name.trim(),
      createdBy: dto.createdBy,
      isActive: true,
      isPrivate: dto.isPrivate || false,
      roomPassword: dto.password || null,
      roomType: dto.roomType,
    });

    if (dto.password) {
      room.setPassword(dto.password);
      return this.roomRepository.update(room);
    }

    return room;
  }
}

