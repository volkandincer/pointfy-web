"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RoomCustomFlag } from "@/interfaces/RetroActionItem.interface";

interface UseRoomCustomFlagsResult {
  customFlags: RoomCustomFlag[];
  loading: boolean;
  error: string | null;
  addCustomFlag: (flagName: string, flagColor?: string) => Promise<void>;
  deleteCustomFlag: (flagId: string) => Promise<void>;
}

export function useRoomCustomFlags(
  roomId: string,
  isAdmin: boolean
): UseRoomCustomFlagsResult {
  const [customFlags, setCustomFlags] = useState<RoomCustomFlag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomFlags = useCallback(async () => {
    if (!roomId) {
      setCustomFlags([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      const { data, error: dbError } = await supabase
        .from("room_custom_flags")
        .select("*")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true });

      if (dbError) {
        setError(dbError.message);
        setCustomFlags([]);
      } else {
        setCustomFlags(data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setCustomFlags([]);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const addCustomFlag = useCallback(
    async (flagName: string, flagColor: string = "#6B7280") => {
      if (!isAdmin || !roomId) {
        throw new Error("Sadece admin custom flag ekleyebilir.");
      }

      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          throw new Error("Kullanıcı bulunamadı.");
        }

        const { error: insertError } = await supabase
          .from("room_custom_flags")
          .insert({
            room_id: roomId,
            flag_name: flagName.trim(),
            flag_color: flagColor,
            created_by_key: userData.user.id,
          });

        if (insertError) throw insertError;
        await fetchCustomFlags();
      } catch (err) {
        throw err;
      }
    },
    [roomId, isAdmin, fetchCustomFlags]
  );

  const deleteCustomFlag = useCallback(
    async (flagId: string) => {
      if (!isAdmin) {
        throw new Error("Sadece admin custom flag silebilir.");
      }

      try {
        const supabase = getSupabase();
        const { error: deleteError } = await supabase
          .from("room_custom_flags")
          .delete()
          .eq("id", flagId);

        if (deleteError) throw deleteError;
        await fetchCustomFlags();
      } catch (err) {
        throw err;
      }
    },
    [isAdmin, fetchCustomFlags]
  );

  useEffect(() => {
    if (!roomId) {
      setCustomFlags([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    fetchCustomFlags();

    const supabase = getSupabase();
    const channel = supabase.channel("room-custom-flags-" + roomId);
    channel.on(
      // @ts-ignore - Supabase channel type inference issue
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_custom_flags",
        filter: `room_id=eq.${roomId}`,
      },
      () => {
        if (mounted) {
          fetchCustomFlags();
        }
      }
    );
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId, fetchCustomFlags]);

  return {
    customFlags,
    loading,
    error,
    addCustomFlag,
    deleteCustomFlag,
  };
}

