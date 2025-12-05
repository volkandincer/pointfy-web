/**
 * useRoomCustomFlags Hook
 * Presentation layer hook for managing room custom flags using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { RoomCustomFlag } from "@/interfaces/RetroActionItem.interface";
import { container } from "../../infrastructure/di/Container";
import { RoomCustomFlagAdapter } from "../adapters/RoomCustomFlagAdapter";
import { getSupabase } from "@/lib/supabase";

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

  useEffect(() => {
    if (!roomId) {
      setCustomFlags([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const getRoomCustomFlagsUseCase = UseCaseFactory.getRoomCustomFlags();
        const fetchedFlags = await getRoomCustomFlagsUseCase.execute(roomId);

        if (!mounted) return;
        setCustomFlags(RoomCustomFlagAdapter.toPresentationArray(fetchedFlags));
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const roomCustomFlagRepository = container.getRoomCustomFlagRepository();
        unsubscribe = roomCustomFlagRepository.subscribe(
          roomId,
          (newFlag) => {
            if (!mounted) return;
            const presentationFlag = RoomCustomFlagAdapter.toPresentation(newFlag);
            setCustomFlags((prev) => {
              const exists = prev.some((f) => f.id === presentationFlag.id);
              if (exists) return prev;
              return [...prev, presentationFlag];
            });
          },
          (deletedId) => {
            if (!mounted) return;
            setCustomFlags((prev) => prev.filter((f) => f.id !== deletedId));
          }
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
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

        const createRoomCustomFlagUseCase = UseCaseFactory.createRoomCustomFlag();
        await createRoomCustomFlagUseCase.execute({
          roomId,
          flagName,
          flagColor,
          createdBy: userData.user.id,
        });
      } catch (err) {
        throw err;
      }
    },
    [roomId, isAdmin]
  );

  const deleteCustomFlag = useCallback(
    async (flagId: string) => {
      if (!isAdmin) {
        throw new Error("Sadece admin custom flag silebilir.");
      }

      try {
        const deleteRoomCustomFlagUseCase = UseCaseFactory.deleteRoomCustomFlag();
        await deleteRoomCustomFlagUseCase.execute(flagId);
      } catch (err) {
        throw err;
      }
    },
    [isAdmin]
  );

  return {
    customFlags,
    loading,
    error,
    addCustomFlag,
    deleteCustomFlag,
  };
}

