/**
 * Room Repository Interface
 * Domain layer abstraction for room data access
 */

import type { Room } from "../entities/Room";

export interface IRoomRepository {
  findById(id: string): Promise<Room | null>;
  findByCode(code: string): Promise<Room | null>;
  findByUserId(userId: string): Promise<Room[]>;
  create(room: Omit<Room, "id" | "code" | "createdAt">): Promise<Room>;
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

