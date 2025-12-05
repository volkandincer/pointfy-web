/**
 * ContactMessage Domain Entity
 * Represents a contact form message
 */

export class ContactMessage {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly message: string,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("ContactMessage ID is required");
    }

    if (!this.name || this.name.trim().length < 2 || this.name.trim().length > 100) {
      throw new Error("Name must be between 2 and 100 characters");
    }

    if (!this.email || !this.isValidEmail(this.email)) {
      throw new Error("Valid email is required");
    }

    if (!this.message || this.message.trim().length < 10 || this.message.trim().length > 2000) {
      throw new Error("Message must be between 10 and 2000 characters");
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static fromRow(row: {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: string;
  }): ContactMessage {
    return new ContactMessage(
      row.id,
      row.name,
      row.email,
      row.message,
      new Date(row.created_at)
    );
  }

  toRow(): {
    id: string;
    name: string;
    email: string;
    message: string;
    created_at: string;
  } {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      message: this.message,
      created_at: this.createdAt.toISOString(),
    };
  }
}

