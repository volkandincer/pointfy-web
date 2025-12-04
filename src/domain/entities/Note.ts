/**
 * Note Domain Entity
 * Pure business logic, no external dependencies
 */

export class Note {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public content: string,
    public category: string,
    public boardId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Note id is required");
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("Note userId is required");
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new Error("Note content cannot be empty");
    }
    if (!this.category || this.category.trim().length === 0) {
      throw new Error("Note category is required");
    }
  }

  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error("Note content cannot be empty");
    }
    this.content = newContent.trim();
    this.updatedAt = new Date();
  }

  updateCategory(newCategory: string): void {
    if (!newCategory || newCategory.trim().length === 0) {
      throw new Error("Note category cannot be empty");
    }
    this.category = newCategory.trim();
    this.updatedAt = new Date();
  }

  assignToBoard(boardId: string): void {
    this.boardId = boardId;
    this.updatedAt = new Date();
  }

  removeFromBoard(): void {
    this.boardId = null;
    this.updatedAt = new Date();
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    user_key: string;
    content: string;
    category: string;
    board_id?: string | null;
    created_at: string;
    updated_at: string;
  }): Note {
    return new Note(
      row.id,
      row.user_key,
      row.content,
      row.category,
      row.board_id || null,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    user_key: string;
    content: string;
    category: string;
    board_id: string | null;
    created_at: string;
    updated_at: string;
  } {
    return {
      id: this.id,
      user_key: this.userId,
      content: this.content,
      category: this.category,
      board_id: this.boardId,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
    };
  }
}

