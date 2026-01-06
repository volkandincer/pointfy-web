/**
 * RetroSession Repository Interface
 * Domain layer abstraction for retro session data access
 */

import type { RetroSession } from "../entities/RetroSession";

export interface IRetroSessionRepository {
  findById(id: string): Promise<RetroSession | null>;
  findActiveByRoomId(roomId: string): Promise<RetroSession | null>;
  findByRoomId(roomId: string): Promise<RetroSession[]>;
  create(roomId: string): Promise<RetroSession>;
  completeSession(sessionId: string): Promise<void>;
  
  // Realtime subscription
  subscribe(
    roomId: string,
    onInsert: (session: RetroSession) => void,
    onUpdate: (session: RetroSession) => void,
    onDelete: (id: string) => void
  ): () => void;
}

