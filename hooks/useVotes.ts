"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { VoteInfo } from "@/interfaces/Voting.interface";

interface UseVotesResult {
  votes: VoteInfo[];
  loading: boolean;
  error: string | null;
}

export function useVotes(
  roomId: string,
  taskId: string | undefined,
  isRevealed: boolean = false
): UseVotesResult {
  const [votes, setVotes] = useState<VoteInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !taskId) {
      setVotes([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    async function fetchVotes() {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabase();
        const { data: taskData } = await supabase
          .from("tasks")
          .select("status")
          .eq("id", taskId)
          .single();

        const shouldShowAllVotes =
          isRevealed || taskData?.status === "completed";

        let query = supabase
          .from("votes")
          .select("user_name, user_key, point")
          .eq("room_id", roomId)
          .eq("task_id", taskId);

        if (!shouldShowAllVotes) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: ownVote } = await supabase
              .from("votes")
              .select("user_name, user_key, point")
              .eq("room_id", roomId)
              .eq("task_id", taskId)
              .eq("user_key", user.id)
              .single();

            const { data: room } = await supabase
              .from("rooms")
              .select("code")
              .eq("id", roomId)
              .single();

            if (room) {
              const { data: isAdmin } = await supabase
                .from("room_participants")
                .select("is_admin")
                .eq("room_code", room.code)
                .eq("user_key", user.id)
                .single();

              if (isAdmin?.is_admin) {
                const { data, error: dbError } = await query;
                if (!mounted) return;
                if (dbError) setError(dbError.message);
                setVotes(data || []);
              } else {
                if (!mounted) return;
                setVotes(ownVote ? [ownVote] : []);
              }
            } else {
              if (!mounted) return;
              setVotes(ownVote ? [ownVote] : []);
            }
          } else {
            setVotes([]);
          }
        } else {
          const { data, error: dbError } = await query;
          if (!mounted) return;
          if (dbError) setError(dbError.message);
          setVotes(data || []);
        }

        setLoading(false);
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Bilinmeyen hata");
        setLoading(false);
      }
    }
    fetchVotes();
    const supabase = getSupabase();
    const channel = supabase.channel("votes-task-" + taskId).on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `task_id=eq.${taskId}`,
      },
      (_payload: any) => {
        fetchVotes();
      }
    );
    channel.subscribe();
    return () => {
      mounted = false;
      channel.unsubscribe();
    };
  }, [roomId, taskId, isRevealed]);

  return { votes, loading, error };
}
