/**
 * useRetroCards Hook
 * Presentation layer hook for managing retro cards using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { RetroCard as DomainRetroCard } from "../../domain/entities/RetroCard";
import type { RetroCard as PresentationRetroCard } from "@/interfaces/Retro.interface";
import { container } from "../../infrastructure/di/Container";
import { RetroCardAdapter } from "../adapters/RetroCardAdapter";

interface UseRetroCardsResult {
  cards: PresentationRetroCard[];
  loading: boolean;
  error: string | null;
}

export function useRetroCards(roomId: string): UseRetroCardsResult {
  const [cards, setCards] = useState<PresentationRetroCard[]>([]);
  const [loading, setLoading] = useState<boolean>(!!roomId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const getRetroCardsUseCase = UseCaseFactory.getRetroCards();
        const fetchedCards = await getRetroCardsUseCase.execute(roomId);

        if (!mounted) return;
        setCards(RetroCardAdapter.toPresentationArray(fetchedCards));
        setLoading(false);

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

  return { cards, loading, error };
}

