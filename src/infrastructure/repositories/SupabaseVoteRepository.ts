/**
 * Supabase Vote Repository Implementation
 * Implements IVoteRepository using Supabase directly
 */

import type { IVoteRepository } from "../../domain/repositories/IVoteRepository";
import { Vote } from "../../domain/entities/Vote";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseVoteRepository implements IVoteRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<Vote | null> {
    const { data, error } = await this.getClient()
      .from("votes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Vote.fromRow({
      id: data.id,
      room_id: data.room_id,
      task_id: data.task_id,
      user_key: data.user_key,
      user_name: data.user_name,
      point: data.point,
      created_at: data.created_at,
    });
  }

  async findByTaskId(taskId: string): Promise<Vote[]> {
    const { data, error } = await this.getClient()
      .from("votes")
      .select("*")
      .eq("task_id", taskId);

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Vote.fromRow({
        id: row.id,
        room_id: row.room_id,
        task_id: row.task_id,
        user_key: row.user_key,
        user_name: row.user_name,
        point: row.point,
        created_at: row.created_at,
      })
    );
  }

  async findByRoomId(roomId: string): Promise<Vote[]> {
    const { data, error } = await this.getClient()
      .from("votes")
      .select("*")
      .eq("room_id", roomId);

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Vote.fromRow({
        id: row.id,
        room_id: row.room_id,
        task_id: row.task_id,
        user_key: row.user_key,
        user_name: row.user_name,
        point: row.point,
        created_at: row.created_at,
      })
    );
  }

  async findByUserIdAndTaskId(userId: string, taskId: string): Promise<Vote | null> {
    const { data, error } = await this.getClient()
      .from("votes")
      .select("*")
      .eq("user_key", userId)
      .eq("task_id", taskId)
      .single();

    if (error || !data) {
      return null;
    }

    return Vote.fromRow({
      id: data.id,
      room_id: data.room_id,
      task_id: data.task_id,
      user_key: data.user_key,
      user_name: data.user_name,
      point: data.point,
      created_at: data.created_at,
    });
  }

  async create(voteData: Omit<Vote, "id" | "createdAt">): Promise<Vote> {
    const now = new Date();
    const vote = new Vote(
      crypto.randomUUID(),
      voteData.roomId,
      voteData.taskId,
      voteData.userId,
      voteData.userName,
      voteData.point,
      now
    );

    const { data, error } = await this.getClient()
      .from("votes")
      .insert(vote.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create vote");
    }

    return Vote.fromRow({
      id: data.id,
      room_id: data.room_id,
      task_id: data.task_id,
      user_key: data.user_key,
      user_name: data.user_name,
      point: data.point,
      created_at: data.created_at,
    });
  }

  async update(vote: Vote): Promise<Vote> {
    const { data, error } = await this.getClient()
      .from("votes")
      .update(vote.toRow())
      .eq("id", vote.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update vote");
    }

    return Vote.fromRow({
      id: data.id,
      room_id: data.room_id,
      task_id: data.task_id,
      user_key: data.user_key,
      user_name: data.user_name,
      point: data.point,
      created_at: data.created_at,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("votes").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  async upsert(voteData: Omit<Vote, "id" | "createdAt">): Promise<Vote> {
    const existing = await this.findByUserIdAndTaskId(voteData.userId, voteData.taskId);
    
    if (existing) {
      existing.updatePoint(voteData.point);
      return this.update(existing);
    } else {
      return this.create(voteData);
    }
  }

  subscribe(
    roomId: string,
    taskId: string,
    onInsert: (vote: Vote) => void,
    onUpdate: (vote: Vote) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`votes-room-${roomId}-task-${taskId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "votes",
        filter: `room_id=eq.${roomId},task_id=eq.${taskId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const vote = Vote.fromRow(payload.new as Parameters<typeof Vote.fromRow>[0]);
          onInsert(vote);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const vote = Vote.fromRow(payload.new as Parameters<typeof Vote.fromRow>[0]);
          onUpdate(vote);
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

