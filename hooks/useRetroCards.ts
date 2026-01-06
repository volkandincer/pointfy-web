/**
 * useRetroCards Hook
 * Presentation layer hook for managing retro cards using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";
import type { RetroCard as DomainRetroCard } from "@/src/domain/entities/RetroCard";
import type { RetroCard as PresentationRetroCard } from "@/interfaces/Retro.interface";
import { container } from "@/src/infrastructure/di/Container";
import { RetroCardAdapter } from "@/src/presentation/adapters/RetroCardAdapter";

interface UseRetroCardsResult {
  cards: PresentationRetroCard[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRetroCards(roomId: string): UseRetroCardsResult {
  const [cards, setCards] = useState<PresentationRetroCard[]>([]);
  const [loading, setLoading] = useState<boolean>(!!roomId);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const getRetroCardsUseCase = UseCaseFactory.getRetroCards();
      const fetchedCards = await getRetroCardsUseCase.execute(roomId);
      setCards(RetroCardAdapter.toPresentationArray(fetchedCards));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      await fetchCards();

      if (!mounted) return;

      // Realtime subscription - repository üzerinden
      const retroCardRepository = container.getRetroCardRepository();
      unsubscribe = retroCardRepository.subscribe(
        roomId,
        (newCard: DomainRetroCard) => {
          if (!mounted) return;
          const presentationCard = RetroCardAdapter.toPresentation(newCard);
          setCards((prev) => {
            const exists = prev.some((c) => c.id === presentationCard.id);
            if (exists) return prev;
            return [...prev, presentationCard];
          });
        },
        (updatedCard: DomainRetroCard) => {
          if (!mounted) return;
          const presentationCard = RetroCardAdapter.toPresentation(updatedCard);
          setCards((prev) =>
            prev.map((c) => (c.id === presentationCard.id ? presentationCard : c))
          );
        },
        (deletedId: string) => {
          if (!mounted) return;
          setCards((prev) => prev.filter((c) => c.id !== deletedId));
        }
      );
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [roomId, fetchCards]);

  return { cards, loading, error, refresh: fetchCards };
}
