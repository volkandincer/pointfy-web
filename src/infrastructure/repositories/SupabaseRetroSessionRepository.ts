/**
 * Supabase RetroSession Repository Implementation
 * Implements IRetroSessionRepository using Supabase directly
 */

import type { IRetroSessionRepository } from "../../domain/repositories/IRetroSessionRepository";
import { RetroSession } from "../../domain/entities/RetroSession";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseRetroSessionRepository implements IRetroSessionRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<RetroSession | null> {
    const { data, error } = await this.getClient()
      .from("retro_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return RetroSession.fromRow({
      id: data.id,
      room_id: data.room_id,
      created_at: data.created_at,
      completed_at: data.completed_at,
      is_active: data.is_active,
    });
  }

  async findActiveByRoomId(roomId: string): Promise<RetroSession | null> {
    const { data, error } = await this.getClient()
      .from("retro_sessions")
      .select("*")
      .eq("room_id", roomId)
      .eq("is_active", true)
      .single();

    if (error || !data) {
      return null;
    }

    return RetroSession.fromRow({
      id: data.id,
      room_id: data.room_id,
      created_at: data.created_at,
      completed_at: data.completed_at,
      is_active: data.is_active,
    });
  }

  async findByRoomId(roomId: string): Promise<RetroSession[]> {
    const { data, error } = await this.getClient()
      .from("retro_sessions")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      RetroSession.fromRow({
        id: row.id,
        room_id: row.room_id,
        created_at: row.created_at,
        completed_at: row.completed_at,
        is_active: row.is_active,
      })
    );
  }

  async create(roomId: string): Promise<RetroSession> {
    // Önce aktif session varsa tamamla
    const activeSession = await this.findActiveByRoomId(roomId);
    if (activeSession) {
      await this.completeSession(activeSession.id);
    }

    const now = new Date();
    const session = new RetroSession(
      crypto.randomUUID(),
      roomId,
      now,
      null,
      true
    );

    const { data, error } = await this.getClient()
      .from("retro_sessions")
      .insert(session.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create retro session");
    }

    return RetroSession.fromRow({
      id: data.id,
      room_id: data.room_id,
      created_at: data.created_at,
      completed_at: data.completed_at,
      is_active: data.is_active,
    });
  }

  async completeSession(sessionId: string): Promise<void> {
    // SQL function hem session'ı tamamlar hem de aksiyon maddesi olmayan kartları siler
    const { error } = await this.getClient()
      .rpc("complete_retro_session_and_cleanup", { session_id_param: sessionId });

    if (error) {
      throw error;
    }
  }

  subscribe(
    roomId: string,
    onInsert: (session: RetroSession) => void,
    onUpdate: (session: RetroSession) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`retro-sessions-room-${roomId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "retro_sessions",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const session = RetroSession.fromRow(payload.new as Parameters<typeof RetroSession.fromRow>[0]);
          onInsert(session);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const session = RetroSession.fromRow(payload.new as Parameters<typeof RetroSession.fromRow>[0]);
          onUpdate(session);
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

