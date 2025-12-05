/**
 * CreateContactMessageUseCase
 * Creates a new contact message
 */

import type { IContactMessageRepository } from "../../../domain/repositories/IContactMessageRepository";
import type { ContactMessage } from "../../../domain/entities/ContactMessage";

export interface CreateContactMessageDTO {
  name: string;
  email: string;
  message: string;
  website?: string; // Honeypot field
}

export class CreateContactMessageUseCase {
  constructor(private contactMessageRepository: IContactMessageRepository) {}

  async execute(dto: CreateContactMessageDTO): Promise<ContactMessage> {
    // Honeypot check
    if (dto.website && dto.website.trim().length > 0) {
      throw new Error("Spam detected");
    }

    if (!dto.name || dto.name.trim().length < 2 || dto.name.trim().length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }

    if (!dto.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.email)) {
      throw new Error("Valid email is required");
    }

    if (!dto.message || dto.message.trim().length < 10 || dto.message.trim().length > 2000) {
      throw new Error("Message must be between 10 and 2000 characters");
    }

    return await this.contactMessageRepository.create({
      name: dto.name.trim(),
      email: dto.email.trim(),
      message: dto.message.trim(),
    });
  }
}

