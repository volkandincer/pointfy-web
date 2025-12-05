/**
 * SupabaseContactMessageRepository
 * Supabase implementation of IContactMessageRepository
 */

import { getSupabase } from "@/lib/supabase";
import type { IContactMessageRepository, CreateContactMessageData } from "../../domain/repositories/IContactMessageRepository";
import { ContactMessage } from "../../domain/entities/ContactMessage";

export class SupabaseContactMessageRepository implements IContactMessageRepository {
  async create(data: CreateContactMessageData): Promise<ContactMessage> {
    if (!data.name || data.name.trim().length < 2 || data.name.trim().length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Valid email is required");
    }

    if (!data.message || data.message.trim().length < 10 || data.message.trim().length > 2000) {
      throw new Error("Message must be between 10 and 2000 characters");
    }

    const supabase = getSupabase();
    const { data: inserted, error } = await supabase
      .from("contact_messages")
      .insert({
        name: data.name.trim(),
        email: data.email.trim(),
        message: data.message.trim(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create contact message: ${error.message}`);
    }

    return ContactMessage.fromRow(inserted);
  }
}

