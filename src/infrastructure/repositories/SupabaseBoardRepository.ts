/**
 * Supabase Board Repository Implementation
 * Implements IBoardRepository using Supabase directly
 */

import type { IBoardRepository } from "../../domain/repositories/IBoardRepository";
import { Board } from "../../domain/entities/Board";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseBoardRepository implements IBoardRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<Board | null> {
    const { data, error } = await this.getClient()
      .from("user_boards")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Board.fromRow({
      id: data.id,
      user_key: data.user_key,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      position: data.position,
      is_archived: data.is_archived,
      is_deleted: data.is_deleted,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async findByUserId(userId: string, includeArchived: boolean = false): Promise<Board[]> {
    let query = this.getClient()
      .from("user_boards")
      .select("*")
      .eq("user_key", userId)
      .eq("is_deleted", false);

    if (!includeArchived) {
      query = query.eq("is_archived", false);
    }

    const { data, error } = await query
      .order("position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Board.fromRow({
        id: row.id,
        user_key: row.user_key,
        name: row.name,
        description: row.description,
        color: row.color,
        icon: row.icon,
        position: row.position,
        is_archived: row.is_archived,
        is_deleted: row.is_deleted,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })
    );
  }

  async create(boardData: Omit<Board, "id" | "createdAt" | "updatedAt">): Promise<Board> {
    const now = new Date();
    const board = new Board(
      crypto.randomUUID(),
      boardData.userId,
      boardData.name,
      boardData.description,
      boardData.color,
      boardData.icon,
      boardData.position,
      boardData.isArchived,
      boardData.isDeleted,
      now,
      now
    );

    const { data, error } = await this.getClient()
      .from("user_boards")
      .insert(board.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create board");
    }

    return Board.fromRow({
      id: data.id,
      user_key: data.user_key,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      position: data.position,
      is_archived: data.is_archived,
      is_deleted: data.is_deleted,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async update(board: Board): Promise<Board> {
    const { data, error } = await this.getClient()
      .from("user_boards")
      .update(board.toRow())
      .eq("id", board.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update board");
    }

    return Board.fromRow({
      id: data.id,
      user_key: data.user_key,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      position: data.position,
      is_archived: data.is_archived,
      is_deleted: data.is_deleted,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("user_boards").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  subscribe(
    userId: string,
    onInsert: (board: Board) => void,
    onUpdate: (board: Board) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`user-boards-${userId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_boards",
        filter: `user_key=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const board = Board.fromRow(payload.new as Parameters<typeof Board.fromRow>[0]);
          if (!board.isDeleted) {
            onInsert(board);
          }
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const board = Board.fromRow(payload.new as Parameters<typeof Board.fromRow>[0]);
          if (board.isDeleted) {
            onDelete(board.id);
          } else {
            onUpdate(board);
          }
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

