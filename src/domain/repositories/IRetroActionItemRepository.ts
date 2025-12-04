/**
 * RetroActionItem Repository Interface
 * Domain layer abstraction for retro action item data access
 */

import type { RetroActionItem } from "../entities/RetroActionItem";

export interface IRetroActionItemRepository {
  findById(id: string): Promise<RetroActionItem | null>;
  findByRoomId(roomId: string): Promise<RetroActionItem[]>;
  create(item: Omit<RetroActionItem, "id" | "createdAt" | "updatedAt" | "position">): Promise<RetroActionItem>;
  update(item: RetroActionItem): Promise<RetroActionItem>;
  delete(id: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    onInsert: (item: RetroActionItem) => void,
    onUpdate: (item: RetroActionItem) => void,
    onDelete: (id: string) => void
  ): () => void;
}

