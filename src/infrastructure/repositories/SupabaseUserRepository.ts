/**
 * SupabaseUserRepository
 * Supabase implementation of IUserRepository
 */

import { getSupabase } from "@/lib/supabase";
import type { IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";

export class SupabaseUserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    if (!id || id.trim().length === 0) {
      throw new Error("User ID is required");
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("id, username, jira_base_url, jira_access_token, jira_refresh_token, jira_token_expires_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return User.fromRow(data);
  }

  async update(user: User): Promise<User> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .update({
        username: user.username,
        jira_base_url: user.jiraBaseUrl,
        jira_access_token: user.jiraAccessToken,
        jira_refresh_token: user.jiraRefreshToken,
        jira_token_expires_at: user.jiraTokenExpiresAt?.toISOString() ?? null,
      })
      .eq("id", user.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return User.fromRow(data);
  }

  async updateJiraBaseUrl(userId: string, jiraBaseUrl: string | null): Promise<void> {
    if (!userId || userId.trim().length === 0) {
      throw new Error("User ID is required");
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from("users")
      .update({ jira_base_url: jiraBaseUrl })
      .eq("id", userId);

    if (error) {
      throw new Error(`Failed to update Jira base URL: ${error.message}`);
    }
  }
}

