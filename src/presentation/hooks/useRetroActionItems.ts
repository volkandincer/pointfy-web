/**
 * useRetroActionItems Hook
 * Presentation layer hook for managing retro action items using use cases
 */

"use client";

import { useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { RetroActionItem as DomainRetroActionItem } from "../../domain/entities/RetroActionItem";
import type { RetroActionItem as PresentationRetroActionItem } from "@/interfaces/RetroActionItem.interface";
import { container } from "../../infrastructure/di/Container";
import { RetroActionItemAdapter } from "../adapters/RetroActionItemAdapter";

interface UseRetroActionItemsResult {
  actionItems: PresentationRetroActionItem[];
  loading: boolean;
  error: string | null;
}

export function useRetroActionItems(roomId: string): UseRetroActionItemsResult {
  const [actionItems, setActionItems] = useState<PresentationRetroActionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setActionItems([]);
      setLoading(false);
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const getRetroActionItemsUseCase = UseCaseFactory.getRetroActionItems();
        const fetchedItems = await getRetroActionItemsUseCase.execute(roomId);

        if (!mounted) return;
        setActionItems(RetroActionItemAdapter.toPresentationArray(fetchedItems));
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const retroActionItemRepository = container.getRetroActionItemRepository();
        unsubscribe = retroActionItemRepository.subscribe(
          roomId,
          (newItem: DomainRetroActionItem) => {
            if (!mounted) return;
            const presentationItem = RetroActionItemAdapter.toPresentation(newItem);
            setActionItems((prev) => {
              const exists = prev.some((i) => i.id === presentationItem.id);
              if (exists) return prev;
              return [...prev, presentationItem];
            });
          },
          (updatedItem: DomainRetroActionItem) => {
            if (!mounted) return;
            const presentationItem = RetroActionItemAdapter.toPresentation(updatedItem);
            setActionItems((prev) =>
              prev.map((i) => (i.id === presentationItem.id ? presentationItem : i))
            );
          },
          (deletedId: string) => {
            if (!mounted) return;
            setActionItems((prev) => prev.filter((i) => i.id !== deletedId));
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

  return { actionItems, loading, error };
}

