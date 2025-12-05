"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";

interface UseRetroTimerResult {
  remainingSeconds: number;
  isActive: boolean;
  isWarning: boolean; // 10 saniye veya daha az kaldığında true
  startTimer: (durationSeconds: number) => Promise<void>;
  stopTimer: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useRetroTimer(roomId: string, isAdmin: boolean): UseRetroTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isWarning = remainingSeconds > 0 && remainingSeconds <= 10;

  // Timer'ı veritabanından yükle ve gerçek zamanlı güncelle
  useEffect(() => {
    let mounted = true;
    let intervalRef: NodeJS.Timeout | null = null;

    async function loadTimer() {
      try {
        const supabase = getSupabase();
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .select("retro_timer_duration, retro_timer_started_at, retro_timer_ended_at")
          .eq("id", roomId)
          .single();

        if (!mounted) return;

        if (roomError) {
          setError(roomError.message);
          setLoading(false);
          return;
        }

        if (!roomData) {
          setLoading(false);
          return;
        }

        // Timer aktif mi kontrol et
        if (
          roomData.retro_timer_started_at &&
          roomData.retro_timer_duration &&
          !roomData.retro_timer_ended_at
        ) {
          const startTime = new Date(roomData.retro_timer_started_at).getTime();
          const durationSeconds = roomData.retro_timer_duration; // Artık saniye cinsinden
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - startTime) / 1000);
          const remaining = Math.max(0, durationSeconds - elapsedSeconds);

          setIsActive(remaining > 0);
          setRemainingSeconds(remaining);

          // Timer aktifse gerçek zamanlı güncelle
          if (remaining > 0) {
            intervalRef = setInterval(() => {
              if (!mounted) return;
              const currentTime = Date.now();
              const currentElapsed = Math.floor((currentTime - startTime) / 1000);
              const currentRemaining = Math.max(0, durationSeconds - currentElapsed);

              setRemainingSeconds(currentRemaining);
              setIsActive(currentRemaining > 0);

              // Timer dolduysa veritabanını güncelle ve timer değerlerini temizle
              if (currentRemaining === 0) {
                const supabase = getSupabase();
                supabase
                  .from("rooms")
                  .update({ 
                    retro_timer_ended_at: new Date().toISOString(),
                    retro_timer_duration: null,
                    retro_timer_started_at: null,
                  })
                  .eq("id", roomId)
                  .then(() => {
                    if (mounted) {
                      setIsActive(false);
                      setRemainingSeconds(0);
                    }
                  });
                if (intervalRef) clearInterval(intervalRef);
                intervalRef = null;
              }
            }, 1000);
          } else {
            // Timer zaten dolmuş, ended_at'i güncelle ve timer değerlerini temizle
            if (!roomData.retro_timer_ended_at) {
              await supabase
                .from("rooms")
                .update({ 
                  retro_timer_ended_at: new Date().toISOString(),
                  retro_timer_duration: null,
                  retro_timer_started_at: null,
                })
                .eq("id", roomId);
            }
            setIsActive(false);
            setRemainingSeconds(0);
          }
        } else {
          setIsActive(false);
          setRemainingSeconds(0);
        }

        setLoading(false);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Bilinmeyen hata");
          setLoading(false);
        }
      }
    }

    loadTimer();

    // Realtime subscription
    const supabase = getSupabase();
    const channel = supabase
      .channel(`retro_timer_${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (!mounted) return;
          
          // Önceki interval'ı temizle
          if (intervalRef) {
            clearInterval(intervalRef);
            intervalRef = null;
          }
          
          const newData = payload.new as {
            retro_timer_duration?: number | null;
            retro_timer_started_at?: string | null;
            retro_timer_ended_at?: string | null;
          };

          // Timer bitmişse veya değerler temizlenmişse durumu sıfırla
          if (newData.retro_timer_ended_at || !newData.retro_timer_started_at || !newData.retro_timer_duration) {
            setIsActive(false);
            setRemainingSeconds(0);
            if (intervalRef) {
              clearInterval(intervalRef);
              intervalRef = null;
            }
            return;
          }

          // Yeni timer başlatılıyor
          if (
            newData.retro_timer_started_at &&
            newData.retro_timer_duration &&
            !newData.retro_timer_ended_at
          ) {
            const startTime = new Date(newData.retro_timer_started_at).getTime();
            const durationSeconds = newData.retro_timer_duration; // Artık saniye cinsinden
            const now = Date.now();
            const elapsedSeconds = Math.floor((now - startTime) / 1000);
            const remaining = Math.max(0, durationSeconds - elapsedSeconds);

            setIsActive(remaining > 0);
            setRemainingSeconds(remaining);

            // Timer aktifse interval başlat
            if (remaining > 0) {
              intervalRef = setInterval(() => {
                if (!mounted) return;
                const currentTime = Date.now();
                const currentElapsed = Math.floor((currentTime - startTime) / 1000);
                const currentRemaining = Math.max(0, durationSeconds - currentElapsed);

                setRemainingSeconds(currentRemaining);
                setIsActive(currentRemaining > 0);

                // Timer dolduysa veritabanını güncelle ve timer değerlerini temizle
                if (currentRemaining === 0) {
                  const supabase = getSupabase();
                  supabase
                    .from("rooms")
                    .update({ 
                      retro_timer_ended_at: new Date().toISOString(),
                      retro_timer_duration: null,
                      retro_timer_started_at: null,
                    })
                    .eq("id", roomId)
                    .then(() => {
                      if (mounted) {
                        setIsActive(false);
                        setRemainingSeconds(0);
                      }
                    });
                  if (intervalRef) clearInterval(intervalRef);
                  intervalRef = null;
                }
              }, 1000);
            }
          } else {
            setIsActive(false);
            setRemainingSeconds(0);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (intervalRef) clearInterval(intervalRef);
      channel.unsubscribe();
    };
  }, [roomId]);

  const startTimer = useCallback(
    async (durationSeconds: number) => {
      if (!isAdmin) {
        setError("Sadece admin timer başlatabilir.");
        return;
      }

      if (durationSeconds <= 0) {
        setError("Timer süresi 0'dan büyük olmalıdır.");
        return;
      }

      try {
        const supabase = getSupabase();
        const startedAt = new Date().toISOString();
        const { error: updateError } = await supabase
          .from("rooms")
          .update({
            retro_timer_duration: durationSeconds, // Artık saniye cinsinden kaydediyoruz
            retro_timer_started_at: startedAt,
            retro_timer_ended_at: null,
          })
          .eq("id", roomId);

        if (updateError) throw updateError;

        setIsActive(true);
        setRemainingSeconds(durationSeconds);
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
      const supabase = getSupabase();
      const { error: updateError } = await supabase
        .from("rooms")
        .update({
          retro_timer_ended_at: new Date().toISOString(),
          retro_timer_duration: null,
          retro_timer_started_at: null,
        })
        .eq("id", roomId);

      if (updateError) throw updateError;

      setIsActive(false);
      setRemainingSeconds(0);
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

