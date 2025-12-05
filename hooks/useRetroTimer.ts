/**
 * useRetroTimer Hook
 * Presentation layer hook for managing retro timer using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";
import { container } from "@/src/infrastructure/di/Container";
import type { Room } from "@/src/domain/entities/Room";

interface UseRetroTimerResult {
  remainingSeconds: number;
  isActive: boolean;
  isWarning: boolean; // 10 saniye veya daha az kaldığında true
  startTimer: (durationSeconds: number) => Promise<void>;
  stopTimer: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useRetroTimer(
  roomId: string,
  isAdmin: boolean
): UseRetroTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(!!roomId);
  const [error, setError] = useState<string | null>(null);

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 10;

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    let intervalRef: NodeJS.Timeout | null = null;

    async function loadTimer() {
      try {
        const getRoomUseCase = UseCaseFactory.getRoom();
        const room = await getRoomUseCase.executeById(roomId);

        if (!mounted) return;

        if (!room) {
          setError("Room not found");
          setLoading(false);
          return;
        }

        const remaining = room.getRemainingSeconds();
        const active = room.isTimerActive();

        setIsActive(active);
        setRemainingSeconds(remaining);
        setLoading(false);

        // Timer aktifse gerçek zamanlı güncelle
        if (active && room.retroTimerStartedAt && room.retroTimerDuration) {
          const startTime = room.retroTimerStartedAt.getTime();
          const durationSeconds = room.retroTimerDuration;

          intervalRef = setInterval(() => {
            if (!mounted) return;
            const currentTime = Date.now();
            const currentElapsed = Math.floor((currentTime - startTime) / 1000);
            const currentRemaining = Math.max(0, durationSeconds - currentElapsed);

            setRemainingSeconds(currentRemaining);
            setIsActive(currentRemaining > 0);

            // Timer dolduysa veritabanını güncelle
            if (currentRemaining === 0) {
              const stopRetroTimerUseCase = UseCaseFactory.stopRetroTimer();
              stopRetroTimerUseCase.execute(roomId).catch(() => {
                // Ignore errors
              });
              if (intervalRef) clearInterval(intervalRef);
              intervalRef = null;
            }
          }, 1000);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Bilinmeyen hata");
          setLoading(false);
        }
      }
    }

    loadTimer();

    // Realtime subscription - repository üzerinden
    const roomRepository = container.getRoomRepository();
    const unsubscribe = roomRepository.subscribe(roomId, (updatedRoom: Room) => {
      if (!mounted) return;

      // Önceki interval'ı temizle
      if (intervalRef) {
        clearInterval(intervalRef);
        intervalRef = null;
      }

      const remaining = updatedRoom.getRemainingSeconds();
      const active = updatedRoom.isTimerActive();

      setIsActive(active);
      setRemainingSeconds(remaining);

      // Timer bitmişse veya değerler temizlenmişse durumu sıfırla
      if (!active) {
        return;
      }

      // Yeni timer başlatılıyor
      if (
        updatedRoom.retroTimerStartedAt &&
        updatedRoom.retroTimerDuration &&
        !updatedRoom.retroTimerEndedAt
      ) {
        const startTime = updatedRoom.retroTimerStartedAt.getTime();
        const durationSeconds = updatedRoom.retroTimerDuration;

        intervalRef = setInterval(() => {
          if (!mounted) return;
          const currentTime = Date.now();
          const currentElapsed = Math.floor((currentTime - startTime) / 1000);
          const currentRemaining = Math.max(0, durationSeconds - currentElapsed);

          setRemainingSeconds(currentRemaining);
          setIsActive(currentRemaining > 0);

          // Timer dolduysa veritabanını güncelle
          if (currentRemaining === 0) {
            const stopRetroTimerUseCase = UseCaseFactory.stopRetroTimer();
            stopRetroTimerUseCase.execute(roomId).catch(() => {
              // Ignore errors
            });
            if (intervalRef) clearInterval(intervalRef);
            intervalRef = null;
          }
        }, 1000);
      }
    });

    return () => {
      mounted = false;
      if (intervalRef) clearInterval(intervalRef);
      unsubscribe();
    };
  }, [roomId]);

  const startTimer = useCallback(
    async (durationSeconds: number) => {
      if (!isAdmin) {
        setError("Sadece admin timer başlatabilir.");
        return;
      }

      try {
        const startRetroTimerUseCase = UseCaseFactory.startRetroTimer();
        await startRetroTimerUseCase.execute(roomId, durationSeconds);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Timer başlatılamadı.");
      }
    },
    [roomId, isAdmin]
  );

  const stopTimer = useCallback(async () => {
    if (!isAdmin) {
      setError("Sadece admin timer durdurabilir.");
      return;
    }

    try {
      const stopRetroTimerUseCase = UseCaseFactory.stopRetroTimer();
      await stopRetroTimerUseCase.execute(roomId);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Timer durdurulamadı.");
    }
  }, [roomId, isAdmin]);

  return {
    remainingSeconds,
    isActive,
    isWarning,
    startTimer,
    stopTimer,
    loading,
    error,
  };
}

