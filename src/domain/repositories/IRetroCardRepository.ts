/**
 * RetroCard Repository Interface
 * Domain layer abstraction for retro card data access
 */

import type { RetroCard, RetroCategory } from "../entities/RetroCard";

export interface CreateRetroCardData {
  roomId: string;
  userId: string;
  userName: string;
  category: RetroCategory;
  content: string;
  isRevealed: boolean;
  retroSessionId?: string | null;
}

export interface IRetroCardRepository {
  findById(id: string): Promise<RetroCard | null>;
  findByRoomId(roomId: string): Promise<RetroCard[]>;
  findByRoomIdAndCategory(roomId: string, category: string): Promise<RetroCard[]>;
  findBySessionId(sessionId: string): Promise<RetroCard[]>;
  create(cardData: CreateRetroCardData): Promise<RetroCard>;
  update(card: RetroCard): Promise<RetroCard>;
  delete(id: string): Promise<void>;
  deleteCardsWithoutActionItems(sessionId: string): Promise<void>;
  
  // Retro-specific operations
  revealAll(roomId: string): Promise<void>;
  revealById(id: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    onInsert: (card: RetroCard) => void,
    onUpdate: (card: RetroCard) => void,
    onDelete: (id: string) => void
  ): () => void;
}

