/**
 * RetroActionItem Repository Interface
 * Domain layer abstraction for retro action item data access
 */

import type { RetroActionItem, RetroActionItemFlag } from "../entities/RetroActionItem";

export interface CreateRetroActionItemData {
  roomId: string;
  content: string;
  createdBy: string;
  createdByUsername: string;
  isCompleted: boolean;
  completedAt: Date | null;
  flag: RetroActionItemFlag | null;
  customFlag: string | null;
}

export interface IRetroActionItemRepository {
  findById(id: string): Promise<RetroActionItem | null>;
  findByRoomId(roomId: string): Promise<RetroActionItem[]>;
  create(itemData: CreateRetroActionItemData): Promise<RetroActionItem>;
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

