/**
 * useNotes Hook
 * Presentation layer hook for managing notes using use cases
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { UseCaseFactory } from "../../application/services/UseCaseFactory";
import type { Note as DomainNote } from "../../domain/entities/Note";
import type { Note as PresentationNote } from "@/interfaces/Note.interface";
import { getSupabase } from "@/lib/supabase";
import { container } from "../../infrastructure/di/Container";
import { NoteAdapter } from "../adapters/NoteAdapter";

// Legacy interface compatibility
export interface NoteInput {
  content: string;
  category: string;
}

interface UseNotesResult {
  notes: PresentationNote[];
  loading: boolean;
  error: string | null;
  addNote: (input: NoteInput) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  updateNote: (id: string, input: NoteInput) => Promise<void>;
}

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useState<PresentationNote[]>([]);
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

        // Use case ile notları yükle
        const getNotesUseCase = UseCaseFactory.getNotes();
        const fetchedNotes = await getNotesUseCase.execute(userData.user.id);

        if (!mounted) return;
        setNotes(NoteAdapter.toPresentationArray(fetchedNotes));
        setLoading(false);

        // Realtime subscription - repository üzerinden
        const noteRepository = container.getNoteRepository();
        unsubscribe = noteRepository.subscribe(
          userData.user.id,
          (newNote: DomainNote) => {
            if (!mounted) return;
            const presentationNote = NoteAdapter.toPresentation(newNote);
            setNotes((prev) => {
              const exists = prev.some((n) => n.id === presentationNote.id);
              if (exists) return prev;
              return [...prev, presentationNote].sort((a, b) => 
                (b.createdAt || 0) - (a.createdAt || 0)
              );
            });
          },
          (updatedNote: DomainNote) => {
            if (!mounted) return;
            const presentationNote = NoteAdapter.toPresentation(updatedNote);
            setNotes((prev) =>
              prev.map((n) => (n.id === presentationNote.id ? presentationNote : n))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            );
          },
          (deletedId: string) => {
            if (!mounted) return;
            setNotes((prev) => prev.filter((n) => n.id !== deletedId));
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

  const addNote = useCallback(
    async (input: NoteInput) => {
      if (!userKey) throw new Error("User not authenticated");

      try {
        const createNoteUseCase = UseCaseFactory.createNote();
        const newNote = await createNoteUseCase.execute({
          userId: userKey,
          content: input.content,
          category: input.category,
        });
        // Realtime subscription will handle the update, but we can optimistically update
        const presentationNote = NoteAdapter.toPresentation(newNote);
        setNotes((prev) => [presentationNote, ...prev].sort((a, b) => 
          (b.createdAt || 0) - (a.createdAt || 0)
        ));
      } catch (err) {
        // Handle category constraint error - fallback to "general"
        if (err instanceof Error && (err.message.includes("check_note_category") || err.message.includes("23514"))) {
          const createNoteUseCase = UseCaseFactory.createNote();
          const newNote = await createNoteUseCase.execute({
            userId: userKey,
            content: input.content,
            category: "general", // Fallback to valid category
          });
          const presentationNote = NoteAdapter.toPresentation(newNote);
          setNotes((prev) => [presentationNote, ...prev].sort((a, b) => 
            (b.createdAt || 0) - (a.createdAt || 0)
          ));
        } else {
          throw err;
        }
      }
    },
    [userKey]
  );

  const removeNote = useCallback(
    async (id: string) => {
      try {
        const deleteNoteUseCase = UseCaseFactory.deleteNote();
        await deleteNoteUseCase.execute(id);
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } catch (err) {
        throw err;
      }
    },
    []
  );

  const updateNote = useCallback(
    async (id: string, input: NoteInput) => {
      try {
        const updateNoteUseCase = UseCaseFactory.updateNote();
        const updatedNote = await updateNoteUseCase.execute({
          noteId: id,
          content: input.content,
          category: input.category,
        });
        // Realtime subscription will handle the update, but we can optimistically update
        const presentationNote = NoteAdapter.toPresentation(updatedNote);
        setNotes((prev) =>
          prev.map((n) => (n.id === presentationNote.id ? presentationNote : n))
            .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        );
      } catch (err) {
        throw err;
      }
    },
    []
  );

  return { notes, loading, error, addNote, removeNote, updateNote };
}

