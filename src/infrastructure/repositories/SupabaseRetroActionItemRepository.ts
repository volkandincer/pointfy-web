/**
 * Supabase RetroActionItem Repository Implementation
 * Implements IRetroActionItemRepository using Supabase directly
 */

import type { IRetroActionItemRepository } from "../../domain/repositories/IRetroActionItemRepository";
import { RetroActionItem } from "../../domain/entities/RetroActionItem";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseRetroActionItemRepository implements IRetroActionItemRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<RetroActionItem | null> {
    const { data, error } = await this.getClient()
      .from("retro_action_items")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return RetroActionItem.fromRow({
      id: data.id,
      room_id: data.room_id,
      content: data.content,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      is_completed: data.is_completed,
      completed_at: data.completed_at,
      position: data.position,
      flag: data.flag,
      custom_flag: data.custom_flag,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async findByRoomId(roomId: string): Promise<RetroActionItem[]> {
    const { data, error } = await this.getClient()
      .from("retro_action_items")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      RetroActionItem.fromRow({
        id: row.id,
        room_id: row.room_id,
        content: row.content,
        created_by_key: row.created_by_key,
        created_by_username: row.created_by_username,
        is_completed: row.is_completed,
        completed_at: row.completed_at,
        position: row.position,
        flag: row.flag,
        custom_flag: row.custom_flag,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async create(itemData: Omit<RetroActionItem, "id" | "createdAt" | "updatedAt" | "position">): Promise<RetroActionItem> {
    // Get max position for this room
    const { data: existingItems } = await this.getClient()
      .from("retro_action_items")
      .select("position")
      .eq("room_id", itemData.roomId)
      .order("position", { ascending: false })
      .limit(1)
      .single();

    const position = existingItems?.position ? existingItems.position + 1 : 0;
    const now = new Date();
    const item = new RetroActionItem(
      crypto.randomUUID(),
      itemData.roomId,
      itemData.content,
      itemData.createdBy,
      itemData.createdByUsername,
      itemData.isCompleted,
      itemData.completedAt,
      position,
      itemData.flag,
      itemData.customFlag,
      now,
      now
    );

    const { data, error } = await this.getClient()
      .from("retro_action_items")
      .insert(item.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create retro action item");
    }

    return RetroActionItem.fromRow({
      id: data.id,
      room_id: data.room_id,
      content: data.content,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      is_completed: data.is_completed,
      completed_at: data.completed_at,
      position: data.position,
      flag: data.flag,
      custom_flag: data.custom_flag,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async update(item: RetroActionItem): Promise<RetroActionItem> {
    const { data, error } = await this.getClient()
      .from("retro_action_items")
      .update(item.toRow())
      .eq("id", item.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update retro action item");
    }

    return RetroActionItem.fromRow({
      id: data.id,
      room_id: data.room_id,
      content: data.content,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      is_completed: data.is_completed,
      completed_at: data.completed_at,
      position: data.position,
      flag: data.flag,
      custom_flag: data.custom_flag,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("retro_action_items").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  subscribe(
    roomId: string,
    onInsert: (item: RetroActionItem) => void,
    onUpdate: (item: RetroActionItem) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`retro-action-items-room-${roomId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "retro_action_items",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const item = RetroActionItem.fromRow(payload.new as Parameters<typeof RetroActionItem.fromRow>[0]);
          onInsert(item);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const item = RetroActionItem.fromRow(payload.new as Parameters<typeof RetroActionItem.fromRow>[0]);
          onUpdate(item);
        } else if (payload.eventType === "DELETE" && payload.old) {
          onDelete(payload.old.id);
        }
      }
    );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }
}

