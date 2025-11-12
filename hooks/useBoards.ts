"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Board, BoardInput } from "@/interfaces/Board.interface";

interface UseBoardsResult {
  boards: Board[];
  loading: boolean;
  error: string | null;
  addBoard: (input: BoardInput) => Promise<Board>;
  updateBoard: (id: string, input: BoardInput) => Promise<void>;
  deleteBoard: (id: string) => Promise<void>;
  archiveBoard: (id: string, archived: boolean) => Promise<void>;
  updateBoardPositions: (positions: { id: string; position: number }[]) => Promise<void>;
}

export function useBoards(): UseBoardsResult {
  const [boards, setBoards] = useState<Board[]>([]);
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

        // Board'ları yükle (silinmemiş ve arşivlenmemiş olanlar)
        const { data: rows, error: fetchError } = await supabase
          .from("user_boards")
          .select("*")
          .eq("user_key", userData.user.id)
          .eq("is_deleted", false)
          .order("position", { ascending: true })
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        setBoards(rows || []);
        setLoading(false);

        // Realtime subscription
        const channel = supabase.channel("user-boards-" + userData.user.id);
        channel.on(
          // @ts-ignore - Supabase channel type inference issue
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "user_boards",
            filter: `user_key=eq.${userData.user.id}`,
          },
          (payload: {
            eventType: string;
            new?: Board;
            old?: { id: string };
          }) => {
            if (!mounted) return;

            if (payload.eventType === "INSERT" && payload.new) {
              const newBoard = payload.new;
              // Silinmemiş board'ları ekle
              if (!newBoard.is_deleted) {
                setBoards((prev) => {
                  const exists = prev.some((b) => b.id === newBoard.id);
                  if (exists) return prev;
                  // Position'a göre sıralı ekle
                  const newBoards = [...prev, newBoard];
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
            } else if (payload.eventType === "DELETE" && payload.old) {
              const oldId = payload.old.id;
              setBoards((prev) => prev.filter((b) => b.id !== oldId));
            } else if (payload.eventType === "UPDATE" && payload.new) {
              const updatedBoard = payload.new;
              // Eğer silinmişse listeden çıkar, değilse güncelle
              if (updatedBoard.is_deleted) {
                setBoards((prev) =>
                  prev.filter((b) => b.id !== updatedBoard.id)
                );
              } else {
                setBoards((prev) =>
                  prev
                    .map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
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
            }
          }
        );

        channel.subscribe();
        unsubscribe = () => channel.unsubscribe();
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
    async (input: BoardInput): Promise<Board> => {
      if (!userKey) throw new Error("User not authenticated");

      const supabase = getSupabase();

      // Mevcut board'ların maksimum position'ını bul
      const { data: existingBoards } = await supabase
        .from("user_boards")
        .select("position")
        .eq("user_key", userKey)
        .eq("is_deleted", false)
        .order("position", { ascending: false })
        .limit(1);

      const maxPosition =
        existingBoards && existingBoards.length > 0
          ? existingBoards[0].position + 1
          : 0;

      const { data: newBoard, error: insertError } = await supabase
        .from("user_boards")
        .insert({
          user_key: userKey,
          name: input.name,
          description: input.description || null,
          color: input.color || null,
          icon: input.icon || null,
          position: input.position !== undefined ? input.position : maxPosition,
          is_archived: false,
          is_deleted: false,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Realtime subscription çalışmıyorsa fallback olarak manuel güncelle
      if (newBoard && !newBoard.is_deleted) {
        setBoards((prev) => {
          const exists = prev.some((b) => b.id === newBoard.id);
          if (exists) return prev;
          const newBoards = [...prev, newBoard];
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

      return newBoard;
    },
    [userKey]
  );

  const updateBoard = useCallback(
    async (id: string, input: BoardInput): Promise<void> => {
      const supabase = getSupabase();
      const { data: updatedBoard, error: updateError } = await supabase
        .from("user_boards")
        .update({
          name: input.name,
          description: input.description || null,
          color: input.color || null,
          icon: input.icon || null,
          position:
            input.position !== undefined
              ? input.position
              : undefined,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Realtime subscription çalışmıyorsa fallback olarak manuel güncelle
      if (updatedBoard) {
        if (updatedBoard.is_deleted) {
          setBoards((prev) => prev.filter((b) => b.id !== updatedBoard.id));
        } else {
          setBoards((prev) =>
            prev
              .map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
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
      }
    },
    []
  );

  const deleteBoard = useCallback(async (id: string): Promise<void> => {
    const supabase = getSupabase();
    // Soft delete
    const { error: deleteError } = await supabase
      .from("user_boards")
      .update({ is_deleted: true })
      .eq("id", id);

    if (deleteError) {
      throw deleteError;
    }

    // Realtime subscription çalışmıyorsa fallback olarak manuel güncelle
    setBoards((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const archiveBoard = useCallback(
    async (id: string, archived: boolean): Promise<void> => {
      const supabase = getSupabase();
      const { data: updatedBoard, error: updateError } = await supabase
        .from("user_boards")
        .update({ is_archived: archived })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Realtime subscription çalışmıyorsa fallback olarak manuel güncelle
      if (updatedBoard) {
        setBoards((prev) =>
          prev.map((b) => (b.id === updatedBoard.id ? updatedBoard : b))
        );
      }
    },
    []
  );

  const updateBoardPositions = useCallback(
    async (positions: { id: string; position: number }[]): Promise<void> => {
      const supabase = getSupabase();

      // Her board için position'ı güncelle
      const updatePromises = positions.map(({ id, position }) =>
        supabase
          .from("user_boards")
          .update({ position })
          .eq("id", id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        throw new Error(
          `Failed to update positions: ${errors[0].error?.message}`
        );
      }

      // Realtime subscription otomatik olarak state'i güncelleyecek
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

