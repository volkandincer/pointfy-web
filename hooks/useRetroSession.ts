/**
 * useRetroSession Hook
 * Presentation layer hook for managing retro sessions using use cases
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UseCaseFactory } from "@/src/application/services/UseCaseFactory";
import type { RetroSession as DomainRetroSession } from "@/src/domain/entities/RetroSession";
import { RetroSessionAdapter, type PresentationRetroSession } from "@/src/presentation/adapters/RetroSessionAdapter";
import { container } from "@/src/infrastructure/di/Container";

interface UseRetroSessionResult {
  session: PresentationRetroSession | null;
  loading: boolean;
  error: string | null;
  createSession: () => Promise<void>;
  completeSession: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useRetroSession(roomId: string, isAdmin: boolean): UseRetroSessionResult {
  const [session, setSession] = useState<PresentationRetroSession | null>(null);
  const [loading, setLoading] = useState<boolean>(!!roomId);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    if (!roomId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const getActiveRetroSessionUseCase = UseCaseFactory.getActiveRetroSession();
      const fetchedSession = await getActiveRetroSessionUseCase.execute(roomId, true);

      if (fetchedSession) {
        setSession(RetroSessionAdapter.toPresentation(fetchedSession));
      } else {
        setSession(null);
      }
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen hata");
      setLoading(false);
    }
  }, [roomId]);

  const createSession = useCallback(async () => {
    if (!roomId || !isAdmin) {
      return;
    }

    try {
      setError(null);
      const createRetroSessionUseCase = UseCaseFactory.createRetroSession();
      const newSession = await createRetroSessionUseCase.execute(roomId);
      setSession(RetroSessionAdapter.toPresentation(newSession));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session oluşturulurken hata oluştu");
      throw err;
    }
  }, [roomId, isAdmin]);

  const completeSession = useCallback(async () => {
    if (!session || !isAdmin) {
      return;
    }

    try {
      setError(null);
      const completeRetroSessionUseCase = UseCaseFactory.completeRetroSession();
      await completeRetroSessionUseCase.execute(session.id);
      
      // Tamamlanmış session'ı getir ve state'e set et
      const retroSessionRepository = container.getRetroSessionRepository();
      const completedSession = await retroSessionRepository.findById(session.id);
      if (completedSession) {
        setSession(RetroSessionAdapter.toPresentation(completedSession));
      } else {
        // Session bulunamazsa null yap (yeni session başlatılabilir)
        setSession(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Session tamamlanırken hata oluştu");
      throw err;
    }
  }, [session, isAdmin]);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      await fetchSession();

      if (!mounted) return;

      // Realtime subscription
      const retroSessionRepository = container.getRetroSessionRepository();
      unsubscribe = retroSessionRepository.subscribe(
        roomId,
        (newSession: DomainRetroSession) => {
          if (!mounted) return;
          const presentationSession = RetroSessionAdapter.toPresentation(newSession);
          if (presentationSession.is_active) {
            setSession(presentationSession);
          }
        },
        (updatedSession: DomainRetroSession) => {
          if (!mounted) return;
          const presentationSession = RetroSessionAdapter.toPresentation(updatedSession);
          // Aktif session ise veya mevcut session'ın güncellenmiş hali ise state'i güncelle
          if (presentationSession.is_active || session?.id === presentationSession.id) {
            setSession(presentationSession);
          }
        },
        (deletedId: string) => {
          if (!mounted) return;
          if (session?.id === deletedId) {
            setSession(null);
          }
        }
      );
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [roomId, fetchSession]);

  return {
    session,
    loading,
    error,
    createSession,
    completeSession,
    refresh: fetchSession,
  };
}

