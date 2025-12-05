/**
 * useRoomParticipants Hook
 * Presentation layer hook for managing room participants using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { RoomParticipant } from "../../application/use-cases/rooms/GetRoomParticipantsUseCase";
import { getSupabase } from "@/lib/supabase";

interface UseRoomParticipantsResult {
  participants: RoomParticipant[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRoomParticipants(
  roomCode: string
): UseRoomParticipantsResult {
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchParticipants = useCallback(async () => {
    if (!roomCode) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const getRoomParticipantsUseCase = UseCaseFactory.getRoomParticipants();
      const fetchedParticipants = await getRoomParticipantsUseCase.execute(roomCode);
      setParticipants(fetchedParticipants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  }, [roomCode]);

  useEffect(() => {
    if (!roomCode) {
      setParticipants([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchParticipants();

    // Realtime subscription
    const supabase = getSupabase();
    const channel = supabase
      .channel("room-participants-" + roomCode)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_participants",
          filter: `room_code=eq.${roomCode}`,
        },
        () => {
          if (mounted) {
            fetchParticipants();
          }
        }
      );
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomCode, fetchParticipants]);

  return {
    participants,
    loading,
    error,
    refresh: fetchParticipants,
  };
}

