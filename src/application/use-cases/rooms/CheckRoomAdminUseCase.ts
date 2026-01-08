/**
 * CheckRoomAdminUseCase
 * Checks if a user is an admin of a room and returns permissions
 */

import type { IRoomRepository } from "../../../domain/repositories/IRoomRepository";
import { getSupabase } from "@/lib/supabase";

export interface RoomPermissions {
  is_admin: boolean;
  is_spectator: boolean;
  can_vote: boolean;
  can_create_tasks: boolean;
  can_manage_room: boolean;
}

export interface CheckRoomAdminResult {
  isAdmin: boolean;
  permissions: RoomPermissions;
}

export class CheckRoomAdminUseCase {
  constructor(private roomRepository: IRoomRepository) {}

  async execute(roomCode: string, userKey: string): Promise<CheckRoomAdminResult> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new Error("Room code is required");
    }

    if (!userKey || userKey.trim().length === 0) {
      throw new Error("User key is required");
    }

    const room = await this.roomRepository.findByCode(roomCode);
    if (!room) {
      throw new Error("Room not found");
    }

    const isCreator = room.createdBy === userKey;

    const supabase = getSupabase();
    
    // Oda ayarlarını al (allow_spectators)
    const { data: roomSettings } = await supabase
      .from("rooms")
      .select("allow_spectators")
      .eq("code", roomCode)
      .single();
    
    const allowSpectators = roomSettings?.allow_spectators ?? false;

    // Katılımcı bilgilerini al (is_admin ve is_spectator)
    const { data: participantData } = await supabase
      .from("room_participants")
      .select("is_admin, is_spectator")
      .eq("room_code", roomCode)
      .eq("user_key", userKey)
      .maybeSingle();

    const isParticipantAdmin = participantData?.is_admin || false;
    const isSpectator = participantData?.is_spectator ?? false;
    const finalAdminStatus = isCreator || isParticipantAdmin;

    // can_vote hesaplama mantığı:
    // - Admin ise: can_vote = false (adminler oy vermez)
    // - İzleyici ise: can_vote = false (izleyiciler oy vermez)
    // - Normal katılımcı ise: can_vote = true
    const canVote = !finalAdminStatus && !isSpectator;

    const permissions: RoomPermissions = {
      is_admin: finalAdminStatus,
      is_spectator: isSpectator,
      can_vote: canVote,
      can_create_tasks: finalAdminStatus,
      can_manage_room: finalAdminStatus,
    };

    return {
      isAdmin: finalAdminStatus,
      permissions,
    };
  }
}

