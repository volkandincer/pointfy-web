/**
 * IContactMessageRepository
 * Repository interface for ContactMessage entities
 */

import type { ContactMessage } from "../entities/ContactMessage";

export interface CreateContactMessageData {
  name: string;
  email: string;
  message: string;
}

export interface IContactMessageRepository {
  create(data: CreateContactMessageData): Promise<ContactMessage>;
}

