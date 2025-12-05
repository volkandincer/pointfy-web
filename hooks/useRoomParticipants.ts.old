"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

export interface RoomParticipant {
  user_key: string;
  username: string;
  is_admin: boolean;
  joined_at: string;
}

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
      const supabase = getSupabase();
      const { data, error: fetchError } = await supabase
        .from("room_participants")
        .select("user_key, username, is_admin, joined_at")
        .eq("room_code", roomCode)
        .order("joined_at", { ascending: true });

      if (fetchError) {
        setError(fetchError.message);
        setParticipants([]);
      } else {
        setParticipants(data || []);
      }
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

