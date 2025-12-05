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
    const { data: participantData } = await supabase
      .from("room_participants")
      .select("is_admin")
      .eq("room_code", roomCode)
      .eq("user_key", userKey)
      .maybeSingle();

    const isParticipantAdmin = participantData?.is_admin || false;
    const finalAdminStatus = isCreator || isParticipantAdmin;

    const permissions: RoomPermissions = {
      is_admin: finalAdminStatus,
      is_spectator: false,
      can_vote: !finalAdminStatus,
      can_create_tasks: finalAdminStatus,
      can_manage_room: finalAdminStatus,
    };

    return {
      isAdmin: finalAdminStatus,
      permissions,
    };
  }
}

