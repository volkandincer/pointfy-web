/**
 * RetroActionItem Adapter
 * Converts between domain entities and presentation layer interfaces
 */

import { RetroActionItem as DomainRetroActionItem } from "../../domain/entities/RetroActionItem";
import type { RetroActionItem as PresentationRetroActionItem } from "@/interfaces/RetroActionItem.interface";

export class RetroActionItemAdapter {
  /**
   * Convert domain RetroActionItem to presentation RetroActionItem interface
   */
  static toPresentation(item: DomainRetroActionItem): PresentationRetroActionItem {
    return {
      id: item.id,
      room_id: item.roomId,
      content: item.content,
      created_by_key: item.createdBy,
      created_by_username: item.createdByUsername,
      is_completed: item.isCompleted,
      completed_at: item.completedAt ? item.completedAt.toISOString() : null,
      position: item.position,
      flag: item.flag,
      custom_flag: item.customFlag,
      created_at: item.createdAt.toISOString(),
      updated_at: item.updatedAt.toISOString(),
    };
  }

  /**
   * Convert presentation RetroActionItem interface to domain RetroActionItem
   */
  static toDomain(item: PresentationRetroActionItem): DomainRetroActionItem {
    return DomainRetroActionItem.fromRow({
      id: item.id,
      room_id: item.room_id,
      content: item.content,
      created_by_key: item.created_by_key,
      created_by_username: item.created_by_username,
      is_completed: item.is_completed,
      completed_at: item.completed_at,
      position: item.position,
      flag: item.flag,
      custom_flag: item.custom_flag,
      created_at: item.created_at,
      updated_at: item.updated_at,
    });
  }

  /**
   * Convert array of domain RetroActionItems to presentation RetroActionItems
   */
  static toPresentationArray(items: DomainRetroActionItem[]): PresentationRetroActionItem[] {
    return items.map((item) => this.toPresentation(item));
  }

  /**
   * Convert array of presentation RetroActionItems to domain RetroActionItems
   */
  static toDomainArray(items: PresentationRetroActionItem[]): DomainRetroActionItem[] {
    return items.map((item) => this.toDomain(item));
  }
}

