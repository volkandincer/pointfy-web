/**
 * Supabase RetroCard Repository Implementation
 * Implements IRetroCardRepository using Supabase directly
 */

import type { IRetroCardRepository } from "../../domain/repositories/IRetroCardRepository";
import { RetroCard } from "../../domain/entities/RetroCard";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseRetroCardRepository implements IRetroCardRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<RetroCard | null> {
    const { data, error } = await this.getClient()
      .from("retro_cards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return RetroCard.fromRow({
      id: data.id,
      room_id: data.room_id,
      user_key: data.user_key,
      user_name: data.user_name,
      category: data.category,
      content: data.content,
      is_revealed: data.is_revealed,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async findByRoomId(roomId: string): Promise<RetroCard[]> {
    const { data, error } = await this.getClient()
      .from("retro_cards")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      RetroCard.fromRow({
        id: row.id,
        room_id: row.room_id,
        user_key: row.user_key,
        user_name: row.user_name,
        category: row.category,
        content: row.content,
        is_revealed: row.is_revealed,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async findByRoomIdAndCategory(roomId: string, category: string): Promise<RetroCard[]> {
    const { data, error } = await this.getClient()
      .from("retro_cards")
      .select("*")
      .eq("room_id", roomId)
      .eq("category", category)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      RetroCard.fromRow({
        id: row.id,
        room_id: row.room_id,
        user_key: row.user_key,
        user_name: row.user_name,
        category: row.category,
        content: row.content,
        is_revealed: row.is_revealed,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async create(cardData: Omit<RetroCard, "id" | "createdAt" | "updatedAt">): Promise<RetroCard> {
    const now = new Date();
    const card = new RetroCard(
      crypto.randomUUID(),
      cardData.roomId,
      cardData.userId,
      cardData.userName,
      cardData.category,
      cardData.content,
      cardData.isRevealed,
      now,
      now
    );

    const { data, error } = await this.getClient()
      .from("retro_cards")
      .insert(card.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create retro card");
    }

    return RetroCard.fromRow({
      id: data.id,
      room_id: data.room_id,
      user_key: data.user_key,
      user_name: data.user_name,
      category: data.category,
      content: data.content,
      is_revealed: data.is_revealed,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async update(card: RetroCard): Promise<RetroCard> {
    const { data, error } = await this.getClient()
      .from("retro_cards")
      .update(card.toRow())
      .eq("id", card.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update retro card");
    }

    return RetroCard.fromRow({
      id: data.id,
      room_id: data.room_id,
      user_key: data.user_key,
      user_name: data.user_name,
      category: data.category,
      content: data.content,
      is_revealed: data.is_revealed,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("retro_cards").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async revealAll(roomId: string): Promise<void> {
    const { error } = await this.getClient()
      .from("retro_cards")
      .update({ is_revealed: true })
      .eq("room_id", roomId)
      .eq("is_revealed", false);

    if (error) {
      throw error;
    }
  }

  async revealById(id: string): Promise<void> {
    const { error } = await this.getClient()
      .from("retro_cards")
      .update({ is_revealed: true })
      .eq("id", id);

    if (error) {
      throw error;
    }
  }

  subscribe(
    roomId: string,
    onInsert: (card: RetroCard) => void,
    onUpdate: (card: RetroCard) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`retro-cards-room-${roomId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "retro_cards",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const card = RetroCard.fromRow(payload.new as Parameters<typeof RetroCard.fromRow>[0]);
          onInsert(card);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const card = RetroCard.fromRow(payload.new as Parameters<typeof RetroCard.fromRow>[0]);
          onUpdate(card);
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

