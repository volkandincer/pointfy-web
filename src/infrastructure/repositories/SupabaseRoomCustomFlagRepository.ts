/**
 * SupabaseRoomCustomFlagRepository
 * Supabase implementation of IRoomCustomFlagRepository
 */

import { getSupabase } from "@/lib/supabase";
import type { IRoomCustomFlagRepository, CreateRoomCustomFlagData } from "../../domain/repositories/IRoomCustomFlagRepository";
import { RoomCustomFlag } from "../../domain/entities/RoomCustomFlag";

export class SupabaseRoomCustomFlagRepository implements IRoomCustomFlagRepository {
  async findByRoomId(roomId: string): Promise<RoomCustomFlag[]> {
    if (!roomId || roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("room_custom_flags")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch custom flags: ${error.message}`);
    }

    return (data || []).map((row) => RoomCustomFlag.fromRow(row));
  }

  async create(data: CreateRoomCustomFlagData): Promise<RoomCustomFlag> {
    if (!data.roomId || data.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (!data.flagName || data.flagName.trim().length === 0) {
      throw new Error("Flag name is required");
    }

    if (!data.flagColor || data.flagColor.trim().length === 0) {
      throw new Error("Flag color is required");
    }

    if (!data.createdBy || data.createdBy.trim().length === 0) {
      throw new Error("Created by is required");
    }

    const supabase = getSupabase();
    const { data: inserted, error } = await supabase
      .from("room_custom_flags")
      .insert({
        room_id: data.roomId,
        flag_name: data.flagName.trim(),
        flag_color: data.flagColor,
        created_by_key: data.createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create custom flag: ${error.message}`);
    }

    return RoomCustomFlag.fromRow(inserted);
  }

  async delete(id: string): Promise<void> {
    if (!id || id.trim().length === 0) {
      throw new Error("Flag ID is required");
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("room_custom_flags")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete custom flag: ${error.message}`);
    }
  }

  subscribe(
    roomId: string,
    onInsert: (flag: RoomCustomFlag) => void,
    onDelete: (id: string) => void
  ): () => void {
    const supabase = getSupabase();
    const channel = supabase.channel(`room-custom-flags-${roomId}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_custom_flags",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          try {
            const flag = RoomCustomFlag.fromRow(payload.new as {
              id: string;
              room_id: string;
              flag_name: string;
              flag_color: string;
              created_by_key: string;
              created_at: string;
            });
            onInsert(flag);
          } catch (err) {
            // Ignore invalid data
          }
        } else if (payload.eventType === "DELETE" && payload.old) {
          onDelete((payload.old as { id: string }).id);
        }
      }
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }
}

