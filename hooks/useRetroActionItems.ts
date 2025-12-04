"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { RetroActionItem } from "@/interfaces/RetroActionItem.interface";

interface UseRetroActionItemsResult {
  actionItems: RetroActionItem[];
  loading: boolean;
  error: string | null;
}

export function useRetroActionItems(roomId: string): UseRetroActionItemsResult {
  const [actionItems, setActionItems] = useState<RetroActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setActionItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    async function fetchRetroActionItems() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data, error: dbError } = await supabase
          .from("retro_action_items")
          .select("id, room_id, content, created_by_key, created_by_username, is_completed, completed_at, position, flag, custom_flag, created_at, updated_at")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });

        if (!mounted) return;
        if (dbError) setError(dbError.message);
        setActionItems(data || []);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchRetroActionItems();

    const supabase = getSupabase();
    const channel = supabase.channel("retro-action-items-room-" + roomId);
    channel.on(
      // @ts-expect-error - Supabase channel type inference issue
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "retro_action_items",
        filter: `room_id=eq.${roomId}`,
      },
      (payload: { eventType: string; new?: { id: string; [key: string]: unknown }; old?: { id: string } }) => {
        if (!mounted) return;
        
        if (payload.eventType === "INSERT" && payload.new) {
          const newItem = payload.new as unknown as RetroActionItem;
          
          // Veri eksikse direkt fetch et (daha güvenilir)
          if (newItem.position === undefined || newItem.position === null || !newItem.created_at) {
            fetchRetroActionItems();
            return;
          }
          
          // Duplicate kontrolü: eğer item zaten varsa ekleme
          setActionItems((prev) => {
            const exists = prev.some((item) => item.id === newItem.id);
            if (exists) {
              return prev;
            }
            
            // Yeni item'ı başa ekle (reverse order için)
            return [newItem, ...prev];
          });
        } else if (payload.eventType === "DELETE" && payload.old) {
          const oldId = payload.old.id;
          setActionItems((prev) => prev.filter((item) => item.id !== oldId));
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const newPayload = payload.new;
          const newId = newPayload.id;
          setActionItems((prev) => {
            const updated = prev.map((item) =>
              item.id === newId ? (newPayload as unknown as RetroActionItem) : item
            );
            // Güncellenmiş item'ı yerinde tut, sıralamayı koru
            return updated.sort((a, b) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
          });
        }
      }
    );
    
    channel.subscribe();

    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId]);

  return { actionItems, loading, error };
}

