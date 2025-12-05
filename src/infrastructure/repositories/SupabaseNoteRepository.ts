/**
 * Supabase Note Repository Implementation
 * Implements INoteRepository using Supabase directly
 */

import type { INoteRepository } from "../../domain/repositories/INoteRepository";
import { Note } from "../../domain/entities/Note";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseNoteRepository implements INoteRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<Note | null> {
    const { data, error } = await this.getClient()
      .from("notes")
      .select("id, user_key, content, category, board_id, created_at, updated_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Note.fromRow({
      id: data.id,
      user_key: data.user_key,
      content: data.content,
      category: data.category,
      board_id: data.board_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async findByUserId(userId: string): Promise<Note[]> {
    const { data, error } = await this.getClient()
      .from("notes")
      .select("id, user_key, content, category, board_id, created_at, updated_at")
      .eq("user_key", userId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Note.fromRow({
        id: row.id,
        user_key: row.user_key,
        content: row.content,
        category: row.category,
        board_id: row.board_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async findByBoardId(boardId: string): Promise<Note[]> {
    const { data, error } = await this.getClient()
      .from("notes")
      .select("id, user_key, content, category, board_id, created_at, updated_at")
      .eq("board_id", boardId);

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Note.fromRow({
        id: row.id,
        user_key: row.user_key,
        content: row.content,
        category: row.category,
        board_id: row.board_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async create(noteData: Omit<Note, "id" | "createdAt" | "updatedAt">): Promise<Note> {
    const now = new Date();
    const note = new Note(
      crypto.randomUUID(),
      noteData.userId,
      noteData.content,
      noteData.category,
      noteData.boardId,
      now,
      now
    );

    const { data, error } = await this.getClient()
      .from("notes")
      .insert(note.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create note");
    }

    return Note.fromRow({
      id: data.id,
      user_key: data.user_key,
      content: data.content,
      category: data.category,
      board_id: data.board_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async update(note: Note): Promise<Note> {
    const { data, error } = await this.getClient()
      .from("notes")
      .update(note.toRow())
      .eq("id", note.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update note");
    }

    return Note.fromRow({
      id: data.id,
      user_key: data.user_key,
      content: data.content,
      category: data.category,
      board_id: data.board_id,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("notes").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  subscribe(
    userId: string,
    onInsert: (note: Note) => void,
    onUpdate: (note: Note) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`user-notes-${userId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notes",
        filter: `user_key=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const note = Note.fromRow(payload.new as Parameters<typeof Note.fromRow>[0]);
          onInsert(note);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const note = Note.fromRow(payload.new as Parameters<typeof Note.fromRow>[0]);
          onUpdate(note);
        } else if (payload.eventType === "DELETE" && payload.old) {
          onDelete(payload.old.id);
        }
      }
    );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }
}

