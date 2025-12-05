/**
 * Room Repository Interface
 * Domain layer abstraction for room data access
 */

import type { Room, RoomType } from "../entities/Room";

export interface CreateRoomData {
  name: string;
  createdBy: string;
  isActive: boolean;
  isPrivate: boolean;
  roomPassword: string | null;
  roomType: RoomType;
}

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findByUserId(userId: string): Promise<Room[]>;
  create(roomData: CreateRoomData): Promise<Room>;
  update(room: Room): Promise<Room>;
  delete(id: string): Promise<void>;
  
  // Room-specific operations
  generateUniqueCode(): Promise<string>;
  verifyPassword(roomId: string, password: string): Promise<boolean>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    onUpdate: (room: Room) => void
  ): () => void;
}

