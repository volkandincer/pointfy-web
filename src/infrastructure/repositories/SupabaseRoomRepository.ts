/**
 * Supabase Room Repository Implementation
 * Implements IRoomRepository using Supabase directly
 */

import type { IRoomRepository } from "../../domain/repositories/IRoomRepository";
import { Room } from "../../domain/entities/Room";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseRoomRepository implements IRoomRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<Room | null> {
    const { data, error } = await this.getClient()
      .from("rooms")
      .select("id, code, name, created_by_key, created_by_username, created_at, is_active, is_private, room_password, room_type")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Room.fromRow({
      id: data.id,
      code: data.code,
      name: data.name,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      is_active: data.is_active,
      is_private: data.is_private,
      room_password: data.room_password,
      room_type: data.room_type || "poker",
    });
  }

  async findByCode(code: string): Promise<Room | null> {
    const { data, error } = await this.getClient()
      .from("rooms")
      .select("id, code, name, created_by_key, created_by_username, created_at, is_active, is_private, room_password, room_type")
      .eq("code", code)
      .single();

    if (error || !data) {
      return null;
    }

    return Room.fromRow({
      id: data.id,
      code: data.code,
      name: data.name,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      is_active: data.is_active,
      is_private: data.is_private,
      room_password: data.room_password,
      room_type: data.room_type || "poker",
    });
  }

  async findByUserId(userId: string): Promise<Room[]> {
    const { data, error } = await this.getClient()
      .from("room_participants")
      .select(`
        rooms (
          id, code, name, created_by_key, created_by_username, created_at, is_active, is_private, room_password, room_type
        )
      `)
      .eq("user_key", userId);

    if (error || !data) {
      return [];
    }

    return data
      .map((row: { rooms: unknown }) => {
        const roomData = row.rooms as {
          id: string;
          code: string;
          name: string;
          created_by_key: string;
          created_by_username?: string;
          created_at: string;
          is_active: boolean;
          is_private: boolean;
          room_password: string | null;
          room_type: string;
        };
        return Room.fromRow({
          id: roomData.id,
          code: roomData.code,
          name: roomData.name,
          created_by_key: roomData.created_by_key,
          created_by_username: roomData.created_by_username,
          created_at: roomData.created_at,
          is_active: roomData.is_active,
          is_private: roomData.is_private,
          room_password: roomData.room_password,
          room_type: roomData.room_type as "poker" | "retro",
        });
      })
      .filter((room): room is Room => room !== null);
  }

  async create(roomData: { name: string; createdBy: string; isActive: boolean; isPrivate: boolean; roomPassword: string | null; roomType: "poker" | "retro" }): Promise<Room> {
    const code = await this.generateUniqueCode();
    const now = new Date();
    const room = new Room(
      crypto.randomUUID(),
      code,
      roomData.name,
      roomData.createdBy,
      now,
      roomData.isActive,
      roomData.isPrivate,
      roomData.roomPassword,
      roomData.roomType
    );

    const { data, error } = await this.getClient()
      .from("rooms")
      .insert(room.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create room");
    }

    return Room.fromRow({
      id: data.id,
      code: data.code,
      name: data.name,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      is_active: data.is_active,
      is_private: data.is_private,
      room_password: data.room_password,
      room_type: data.room_type,
    });
  }

  async update(room: Room): Promise<Room> {
    const { data, error } = await this.getClient()
      .from("rooms")
      .update(room.toRow())
      .eq("id", room.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update room");
    }

    return Room.fromRow({
      id: data.id,
      code: data.code,
      name: data.name,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      is_active: data.is_active,
      is_private: data.is_private,
      room_password: data.room_password,
      room_type: data.room_type,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("rooms").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async generateUniqueCode(): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const existing = await this.findByCode(code);
      if (!existing) {
        return code;
      }

      attempts++;
    }

    throw new Error("Failed to generate unique room code");
  }

  async verifyPassword(roomId: string, password: string): Promise<boolean> {
    const room = await this.findById(roomId);
    if (!room) {
      return false;
    }
    return room.roomPassword === password;
  }

  subscribe(roomId: string, onUpdate: (room: Room) => void): () => void {
    const channel = this.getClient().channel(`room-${roomId}`);
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.new) {
          const room = Room.fromRow(payload.new as Parameters<typeof Room.fromRow>[0]);
          onUpdate(room);
        }
      }
    );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }
}

