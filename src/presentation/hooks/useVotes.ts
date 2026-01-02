/**
 * useVotes Hook
 * Presentation layer hook for managing votes using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { VoteInfo } from "@/interfaces/Voting.interface";
import { getSupabase } from "@/lib/supabase";
import { container } from "../../infrastructure/di/Container";
import { VoteAdapter } from "../adapters/VoteAdapter";

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
      setTimeout(() => {
        setVotes([]);
        setLoading(false);
      }, 0);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        // Get current user
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        const currentUserId = userData.user?.id;

        // Use case ile vote'ları yükle
        const getVotesUseCase = UseCaseFactory.getVotes();
        const fetchedVotes = await getVotesUseCase.execute({
          roomId,
          taskId,
          isRevealed,
          currentUserId,
        });

        if (!mounted) return;
        setVotes(VoteAdapter.toPresentationArray(fetchedVotes));
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const voteRepository = container.getVoteRepository();
        unsubscribe = voteRepository.subscribe(
          roomId,
          taskId,
          () => {
            if (!mounted) return;
            // Re-fetch votes when a new vote is added (to respect visibility rules)
            getVotesUseCase
              .execute({
                roomId,
                taskId,
                isRevealed,
                currentUserId,
              })
              .then((updatedVotes) => {
                if (!mounted) return;
                setVotes(VoteAdapter.toPresentationArray(updatedVotes));
              });
          },
          () => {
            if (!mounted) return;
            // Re-fetch votes when a vote is updated
            getVotesUseCase
              .execute({
                roomId,
                taskId,
                isRevealed,
                currentUserId,
              })
              .then((updatedVotes) => {
                if (!mounted) return;
                setVotes(VoteAdapter.toPresentationArray(updatedVotes));
              });
          },
          () => {
            if (!mounted) return;
            // Re-fetch votes when a vote is deleted
            getVotesUseCase
              .execute({
                roomId,
                taskId,
                isRevealed,
                currentUserId,
              })
              .then((updatedVotes) => {
                if (!mounted) return;
                setVotes(VoteAdapter.toPresentationArray(updatedVotes));
              });
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
  }, [roomId, taskId, isRevealed]);

  return { votes, loading, error };
}

