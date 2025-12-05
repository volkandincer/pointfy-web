/**
 * IRoomCustomFlagRepository
 * Repository interface for RoomCustomFlag entities
 */

import type { RoomCustomFlag } from "../entities/RoomCustomFlag";

export interface CreateRoomCustomFlagData {
  roomId: string;
  flagName: string;
  flagColor: string;
  createdBy: string;
}

export interface IRoomCustomFlagRepository {
  findByRoomId(roomId: string): Promise<RoomCustomFlag[]>;
  create(data: CreateRoomCustomFlagData): Promise<RoomCustomFlag>;
  delete(id: string): Promise<void>;
  subscribe(
    roomId: string,
    onInsert: (flag: RoomCustomFlag) => void,
    onDelete: (id: string) => void
  ): () => void;
}

