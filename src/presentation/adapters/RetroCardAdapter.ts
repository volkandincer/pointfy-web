/**
 * RetroCard Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { RetroCard as DomainRetroCard } from "../../domain/entities/RetroCard";
import type { RetroCard as PresentationRetroCard } from "@/interfaces/Retro.interface";

export class RetroCardAdapter {
  /**
   * Convert domain RetroCard to presentation RetroCard interface
   */
  static toPresentation(card: DomainRetroCard): PresentationRetroCard {
    return {
      id: card.id,
      room_id: card.roomId,
      user_key: card.userId,
      user_name: card.userName,
      category: card.category,
      content: card.content,
      is_revealed: card.isRevealed,
      created_at: card.createdAt.toISOString(),
      updated_at: card.updatedAt.toISOString(),
    };
  }

  /**
   * Convert presentation RetroCard interface to domain RetroCard
   */
  static toDomain(card: PresentationRetroCard): DomainRetroCard {
    return DomainRetroCard.fromRow({
      id: card.id,
      room_id: card.room_id,
      user_key: card.user_key,
      user_name: card.user_name,
      category: card.category,
      content: card.content,
      is_revealed: card.is_revealed,
      created_at: card.created_at,
      updated_at: card.updated_at,
    });
  }

  /**
   * Convert array of domain RetroCards to presentation RetroCards
   */
  static toPresentationArray(cards: DomainRetroCard[]): PresentationRetroCard[] {
    return cards.map((card) => this.toPresentation(card));
  }

  /**
   * Convert array of presentation RetroCards to domain RetroCards
   */
  static toDomainArray(cards: PresentationRetroCard[]): DomainRetroCard[] {
    return cards.map((card) => this.toDomain(card));
  }
}

