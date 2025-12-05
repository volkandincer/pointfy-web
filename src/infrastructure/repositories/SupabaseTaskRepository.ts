/**
 * Supabase Task Repository Implementation
 * Implements ITaskRepository using Supabase directly
 */

import type { ITaskRepository } from "../../domain/repositories/ITaskRepository";
import { Task } from "../../domain/entities/Task";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";

export class SupabaseTaskRepository implements ITaskRepository {
  constructor(private supabase?: SupabaseClient) {}

  private getClient(): SupabaseClient {
    return this.supabase || getSupabase();
  }

  async findById(id: string): Promise<Task | null> {
    const { data, error } = await this.getClient()
      .from("tasks")
      .select("id, room_id, title, description, status, created_by_key, created_by_username, created_at, updated_at, jira_key, jira_url, jira_id")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return Task.fromRow({
      id: data.id,
      room_id: data.room_id,
      title: data.title,
      description: data.description,
      status: data.status,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      updated_at: data.updated_at,
      jira_key: data.jira_key,
      jira_url: data.jira_url,
      jira_id: data.jira_id,
    });
  }

  async findByRoomId(roomId: string): Promise<Task[]> {
    const { data, error } = await this.getClient()
      .from("tasks")
      .select("id, room_id, title, description, status, created_by_key, created_by_username, created_at, updated_at, jira_key, jira_url, jira_id")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map((row) =>
      Task.fromRow({
        id: row.id,
        room_id: row.room_id,
        title: row.title,
        description: row.description,
        status: row.status,
        created_by_key: row.created_by_key,
        created_by_username: row.created_by_username,
        created_at: row.created_at,
        updated_at: row.updated_at,
        jira_key: row.jira_key,
        jira_url: row.jira_url,
        jira_id: row.jira_id,
      })
    );
  }

  async create(taskData: { roomId: string; title: string; description: string | null; status: "active" | "pending" | "completed"; createdBy: string; jiraKey: string | null; jiraUrl: string | null; jiraId: string | null }): Promise<Task> {
    const now = new Date();
    const task = new Task(
      crypto.randomUUID(),
      taskData.roomId,
      taskData.title,
      taskData.description,
      taskData.status,
      taskData.createdBy,
      now,
      now,
      taskData.jiraKey || null,
      taskData.jiraUrl || null,
      taskData.jiraId || null
    );

    const { data, error } = await this.getClient()
      .from("tasks")
      .insert(task.toRow())
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to create task");
    }

    return Task.fromRow({
      id: data.id,
      room_id: data.room_id,
      title: data.title,
      description: data.description,
      status: data.status,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      updated_at: data.updated_at,
      jira_key: data.jira_key,
      jira_url: data.jira_url,
      jira_id: data.jira_id,
    });
  }

  async update(task: Task): Promise<Task> {
    const { data, error } = await this.getClient()
      .from("tasks")
      .update(task.toRow())
      .eq("id", task.id)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error("Failed to update task");
    }

    return Task.fromRow({
      id: data.id,
      room_id: data.room_id,
      title: data.title,
      description: data.description,
      status: data.status,
      created_by_key: data.created_by_key,
      created_by_username: data.created_by_username,
      created_at: data.created_at,
      updated_at: data.updated_at,
      jira_key: data.jira_key,
      jira_url: data.jira_url,
      jira_id: data.jira_id,
    });
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.getClient().from("tasks").delete().eq("id", id);

    if (error) {
      throw error;
    }
  }

  subscribe(
    roomId: string,
    onInsert: (task: Task) => void,
    onUpdate: (task: Task) => void,
    onDelete: (id: string) => void
  ): () => void {
    const channel = this.getClient().channel(`tasks-room-${roomId}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "tasks",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        if (payload.eventType === "INSERT" && payload.new) {
          const task = Task.fromRow(payload.new as Parameters<typeof Task.fromRow>[0]);
          onInsert(task);
        } else if (payload.eventType === "UPDATE" && payload.new) {
          const task = Task.fromRow(payload.new as Parameters<typeof Task.fromRow>[0]);
          onUpdate(task);
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

