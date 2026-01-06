/**
 * RetroCard Domain Entity
 * Pure business logic, no external dependencies
 */

export type RetroCategory = "mad" | "sad" | "glad";

export class RetroCard {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public readonly userId: string,
    public readonly userName: string,
    public category: RetroCategory,
    public content: string,
    public isRevealed: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public retroSessionId: string | null = null
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("RetroCard id is required");
    }
    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("RetroCard roomId is required");
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("RetroCard userId is required");
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new Error("RetroCard content cannot be empty");
    }
    if (!["mad", "sad", "glad"].includes(this.category)) {
      throw new Error("Invalid retro category");
    }
  }

  updateContent(newContent: string): void {
    if (this.isRevealed) {
      throw new Error("Cannot update content after card is revealed");
    }
    if (!newContent || newContent.trim().length === 0) {
      throw new Error("RetroCard content cannot be empty");
    }
    this.content = newContent.trim();
    this.updatedAt = new Date();
  }

  updateCategory(newCategory: RetroCategory): void {
    if (this.isRevealed) {
      throw new Error("Cannot update category after card is revealed");
    }
    if (!["mad", "sad", "glad"].includes(newCategory)) {
      throw new Error("Invalid retro category");
    }
    this.category = newCategory;
    this.updatedAt = new Date();
  }

  reveal(): void {
    this.isRevealed = true;
    this.updatedAt = new Date();
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    room_id: string;
    user_key: string;
    user_name: string;
    category: RetroCategory;
    content: string;
    is_revealed: boolean;
    created_at: string;
    updated_at: string;
    retro_session_id?: string | null;
  }): RetroCard {
    return new RetroCard(
      row.id,
      row.room_id,
      row.user_key,
      row.user_name,
      row.category,
      row.content,
      row.is_revealed,
      new Date(row.created_at),
      new Date(row.updated_at),
      row.retro_session_id || null
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    room_id: string;
    user_key: string;
    user_name: string;
    category: RetroCategory;
    content: string;
    is_revealed: boolean;
    created_at: string;
    updated_at: string;
    retro_session_id: string | null;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      user_key: this.userId,
      user_name: this.userName,
      category: this.category,
      content: this.content,
      is_revealed: this.isRevealed,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
      retro_session_id: this.retroSessionId,
    };
  }
}

