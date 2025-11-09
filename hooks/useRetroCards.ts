"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RetroCard } from "@/interfaces/Retro.interface";

interface UseRetroCardsResult {
  cards: RetroCard[];
  loading: boolean;
  error: string | null;
}

export function useRetroCards(roomId: string): UseRetroCardsResult {
  const [cards, setCards] = useState<RetroCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setCards([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchRetroCards() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data, error: dbError } = await supabase
          .from("retro_cards")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: true });

        if (!mounted) return;
        if (dbError) setError(dbError.message);
        setCards(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRetroCards();

    const supabase = getSupabase();
    const channel = supabase.channel("retro-cards-room-" + roomId);
    channel.on(
      // @ts-ignore - Supabase channel type inference issue
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "retro_cards",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: { eventType: string; new?: { id: string; [key: string]: unknown }; old?: { id: string } }) => {
        if (!mounted) return;
        if (payload.eventType === "INSERT" && payload.new) {
          setCards((prev) => [...prev, payload.new as unknown as RetroCard]);
        } else if (payload.eventType === "DELETE" && payload.old) {
          const oldId = payload.old.id;
          setCards((prev) => prev.filter((c) => c.id !== oldId));
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const newPayload = payload.new;
          const newId = newPayload.id;
          setCards((prev) =>
            prev.map((c) =>
              c.id === newId ? (newPayload as unknown as RetroCard) : c
            )
          );
        }
      }
    );
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId]);

  return { cards, loading, error };
}
