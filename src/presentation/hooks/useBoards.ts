/**
 * useBoards Hook
 * Presentation layer hook for managing boards using use cases
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { Board as DomainBoard } from "../../domain/entities/Board";
import type { Board as PresentationBoard, BoardInput } from "@/interfaces/Board.interface";
import { getSupabase } from "@/lib/supabase";
import { container } from "../../infrastructure/di/Container";
import { BoardAdapter } from "../adapters/BoardAdapter";

interface UseBoardsResult {
  boards: PresentationBoard[];
  loading: boolean;
  error: string | null;
  addBoard: (input: BoardInput) => Promise<PresentationBoard>;
  updateBoard: (id: string, input: BoardInput) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  archiveBoard: (id: string, archived: boolean) => Promise<void>;
  updateBoardPositions: (positions: { id: string; position: number }[]) => Promise<void>;
}

export function useBoards(): UseBoardsResult {
  const [boards, setBoards] = useState<PresentationBoard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [userKey, setUserKey] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const supabase = getSupabase();
        const { data: userData } = await supabase.auth.getUser();
        if (!mounted) return;
        if (!userData.user) {
          setLoading(false);
          return;
        }

        setUserKey(userData.user.id);

        // Use case ile board'ları yükle
        const getBoardsUseCase = UseCaseFactory.getBoards();
        const fetchedBoards = await getBoardsUseCase.execute(userData.user.id, false);

        if (!mounted) return;
        setBoards(BoardAdapter.toPresentationArray(fetchedBoards));
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const boardRepository = container.getBoardRepository();
        unsubscribe = boardRepository.subscribe(
          userData.user.id,
          (newBoard: DomainBoard) => {
            if (!mounted) return;
            if (!newBoard.isDeleted) {
              const presentationBoard = BoardAdapter.toPresentation(newBoard);
              setBoards((prev) => {
                const exists = prev.some((b) => b.id === presentationBoard.id);
                if (exists) return prev;
                const newBoards = [...prev, presentationBoard];
                return newBoards.sort((a, b) => {
                  if (a.position !== b.position) {
                    return a.position - b.position;
                  }
                  return (
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime()
                  );
                });
              });
            }
          },
          (updatedBoard: DomainBoard) => {
            if (!mounted) return;
            const presentationBoard = BoardAdapter.toPresentation(updatedBoard);
            if (updatedBoard.isDeleted) {
              setBoards((prev) => prev.filter((b) => b.id !== presentationBoard.id));
            } else {
              setBoards((prev) =>
                prev
                  .map((b) => (b.id === presentationBoard.id ? presentationBoard : b))
                  .sort((a, b) => {
                    if (a.position !== b.position) {
                      return a.position - b.position;
                    }
                    return (
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                    );
                  })
              );
            }
          },
          (deletedId: string) => {
            if (!mounted) return;
            setBoards((prev) => prev.filter((b) => b.id !== deletedId));
          }
        );
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addBoard = useCallback(
    async (input: BoardInput): Promise<PresentationBoard> => {
      if (!userKey) throw new Error("User not authenticated");

      try {
        const createBoardUseCase = UseCaseFactory.createBoard();
        const newBoard = await createBoardUseCase.execute({
          userId: userKey,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          position: input.position,
        });
        const presentationBoard = BoardAdapter.toPresentation(newBoard);
        // Realtime subscription will handle the update, but we can optimistically update
        setBoards((prev) => {
          const exists = prev.some((b) => b.id === presentationBoard.id);
          if (exists) return prev;
          const newBoards = [...prev, presentationBoard];
          return newBoards.sort((a, b) => {
            if (a.position !== b.position) {
              return a.position - b.position;
            }
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });
        });
        return presentationBoard;
      } catch (err) {
        throw err;
      }
    },
    [userKey]
  );

  const updateBoard = useCallback(
    async (id: string, input: BoardInput): Promise<void> => {
      try {
        const updateBoardUseCase = UseCaseFactory.updateBoard();
        const updatedBoard = await updateBoardUseCase.execute({
          boardId: id,
          name: input.name,
          description: input.description,
          color: input.color,
          icon: input.icon,
          position: input.position,
        });
        // Realtime subscription will handle the update, but we can optimistically update
        const presentationBoard = BoardAdapter.toPresentation(updatedBoard);
        if (updatedBoard.isDeleted) {
          setBoards((prev) => prev.filter((b) => b.id !== presentationBoard.id));
        } else {
          setBoards((prev) =>
            prev
              .map((b) => (b.id === presentationBoard.id ? presentationBoard : b))
              .sort((a, b) => {
                if (a.position !== b.position) {
                  return a.position - b.position;
                }
                return (
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime()
                );
              })
          );
        }
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const deleteBoard = useCallback(async (id: string): Promise<void> => {
    try {
      const deleteBoardUseCase = UseCaseFactory.deleteBoard();
      await deleteBoardUseCase.execute(id);
      // Realtime subscription will handle the update
    } catch (err) {
      throw err;
    }
  }, []);

  const archiveBoard = useCallback(
    async (id: string, archived: boolean): Promise<void> => {
      try {
        const archiveBoardUseCase = UseCaseFactory.archiveBoard();
        const updatedBoard = await archiveBoardUseCase.execute({
          boardId: id,
          archived,
        });
        // Realtime subscription will handle the update, but we can optimistically update
        const presentationBoard = BoardAdapter.toPresentation(updatedBoard);
        setBoards((prev) =>
          prev.map((b) => (b.id === presentationBoard.id ? presentationBoard : b))
        );
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const updateBoardPositions = useCallback(
    async (positions: { id: string; position: number }[]): Promise<void> => {
      try {
        const updateBoardPositionsUseCase = UseCaseFactory.updateBoardPositions();
        await updateBoardPositionsUseCase.execute({ positions });
        // Realtime subscription will handle the update
      } catch (err) {
        throw err;
      }
    },
    []
  );

  return {
    boards,
    loading,
    error,
    addBoard,
    updateBoard,
    deleteBoard,
    archiveBoard,
    updateBoardPositions,
  };
}

