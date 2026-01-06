/**
 * RetroSession Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { RetroSession as DomainRetroSession } from "../../domain/entities/RetroSession";

export interface PresentationRetroSession {
  id: string;
  room_id: string;
  created_at: string;
  completed_at: string | null;
  is_active: boolean;
}

export class RetroSessionAdapter {
  /**
   * Convert domain RetroSession to presentation RetroSession interface
   */
  static toPresentation(session: DomainRetroSession): PresentationRetroSession {
    return {
      id: session.id,
      room_id: session.roomId,
      created_at: session.createdAt.toISOString(),
      completed_at: session.completedAt ? session.completedAt.toISOString() : null,
      is_active: session.isActive,
    };
  }

  /**
   * Convert presentation RetroSession interface to domain RetroSession
   */
  static toDomain(session: PresentationRetroSession): DomainRetroSession {
    return DomainRetroSession.fromRow({
      id: session.id,
      room_id: session.room_id,
      created_at: session.created_at,
      completed_at: session.completed_at,
      is_active: session.is_active,
    });
  }

  /**
   * Convert array of domain RetroSessions to presentation RetroSessions
   */
  static toPresentationArray(sessions: DomainRetroSession[]): PresentationRetroSession[] {
    return sessions.map((session) => this.toPresentation(session));
  }

  /**
   * Convert array of presentation RetroSessions to domain RetroSessions
   */
  static toDomainArray(sessions: PresentationRetroSession[]): DomainRetroSession[] {
    return sessions.map((session) => this.toDomain(session));
  }
}

