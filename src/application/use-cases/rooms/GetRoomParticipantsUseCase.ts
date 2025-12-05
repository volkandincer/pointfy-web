/**
 * GetRoomParticipantsUseCase
 * Fetches participants for a room
 */

import { getSupabase } from "@/lib/supabase";

export interface RoomParticipant {
  user_key: string;
  username: string;
  is_admin: boolean;
  joined_at: string;
}

export class GetRoomParticipantsUseCase {
  async execute(roomCode: string): Promise<RoomParticipant[]> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new Error("Room code is required");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("room_participants")
      .select("user_key, username, is_admin, joined_at")
      .eq("room_code", roomCode)
      .order("joined_at", { ascending: true });

    if (error) {
      throw error;
    }

    return (data || []) as RoomParticipant[];
  }
}

