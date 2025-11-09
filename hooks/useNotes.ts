import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Note, NoteInput } from "@/interfaces/Note.interface";

interface UseNotesResult {
  notes: Note[];
  loading: boolean;
  error: string | null;
  addNote: (input: NoteInput) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  updateNote: (id: string, input: NoteInput) => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<Note[]>([]);
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

        // Notları yükle
        const { data: rows, error: fetchError } = await supabase
          .from("notes")
          .select("id, user_key, content, category, created_at, updated_at")
          .eq("user_key", userData.user.id)
          .order("updated_at", { ascending: false })
          .order("created_at", { ascending: false });

        if (!mounted) return;

        if (fetchError) {
          setError(fetchError.message);
          setLoading(false);
          return;
        }

        // Mobil uyumluluk için createdAt ekle
        const notesWithCreatedAt = (rows || []).map((note) => ({
          ...note,
          createdAt: note.created_at
            ? new Date(note.created_at).getTime()
            : Date.now(),
        }));

        setNotes(notesWithCreatedAt);
        setLoading(false);

        // Realtime subscription
        const channel = supabase
          .channel("user-notes-" + userData.user.id)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notes",
              filter: `user_key=eq.${userData.user.id}`,
            },
            (payload: any) => {
              if (!mounted) return;

              if (payload.eventType === "INSERT") {
                const newNote = {
                  ...(payload.new as Note),
                  createdAt: payload.new.created_at
                    ? new Date(payload.new.created_at).getTime()
                    : Date.now(),
                };
                // Duplicate kontrolü: eğer not zaten varsa ekleme
                setNotes((prev) => {
                  const exists = prev.some((n) => n.id === newNote.id);
                  if (exists) return prev;
                  return [newNote, ...prev];
                });
              } else if (payload.eventType === "DELETE") {
                setNotes((prev) =>
                  prev.filter((n) => n.id !== payload.old.id)
                );
              } else if (payload.eventType === "UPDATE") {
                const updatedNote = {
                  ...(payload.new as Note),
                  createdAt: payload.new.created_at
                    ? new Date(payload.new.created_at).getTime()
                    : Date.now(),
                };
                setNotes((prev) =>
                  prev.map((n) =>
                    n.id === payload.new.id ? updatedNote : n
                  )
                );
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

  const addNote = useCallback(
    async (input: NoteInput) => {
      if (!userKey) throw new Error("User not authenticated");

      const supabase = getSupabase();
      const { data, error: insertError } = await supabase
        .from("notes")
        .insert({
          user_key: userKey,
          content: input.content,
          category: input.category,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        console.error("Error code:", insertError.code);
        console.error("Error message:", insertError.message);
        console.error("Error details:", insertError.details);
        console.error("Error hint:", insertError.hint);
        throw insertError;
      }

      // Realtime subscription otomatik olarak state'i güncelleyecek,
      // manuel güncelleme yapmaya gerek yok
    },
    [userKey]
  );

  const removeNote = useCallback(async (id: string) => {
    const supabase = getSupabase();
    const { error: deleteError } = await supabase
      .from("notes")
      .delete()
      .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      // Realtime subscription otomatik olarak state'i güncelleyecek,
      // manuel güncelleme yapmaya gerek yok
  }, []);

  const updateNote = useCallback(
    async (id: string, input: NoteInput) => {
      const supabase = getSupabase();
      const { data, error: updateError } = await supabase
        .from("notes")
        .update({
          content: input.content,
          category: input.category,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Realtime subscription otomatik olarak state'i güncelleyecek,
      // manuel güncelleme yapmaya gerek yok
    },
    []
  );

  return {
    notes,
    loading,
    error,
    addNote,
    removeNote,
    updateNote,
  };
}

