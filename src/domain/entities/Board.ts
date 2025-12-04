/**
 * Board Domain Entity
 * Pure business logic, no external dependencies
 */

export class Board {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public name: string,
    public description: string | null,
    public color: string | null,
    public icon: string | null,
    public position: number,
    public isArchived: boolean,
    public isDeleted: boolean,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Board id is required");
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("Board userId is required");
    }
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Board name cannot be empty");
    }
    if (this.position < 0) {
      throw new Error("Position cannot be negative");
    }
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Board name cannot be empty");
    }
    this.name = newName.trim();
    this.updatedAt = new Date();
  }

  updateDescription(newDescription: string | null): void {
    this.description = newDescription ? newDescription.trim() : null;
    this.updatedAt = new Date();
  }

  setColor(color: string | null): void {
    if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new Error("Color must be a valid hex color code");
    }
    this.color = color;
    this.updatedAt = new Date();
  }

  setIcon(icon: string | null): void {
    this.icon = icon;
    this.updatedAt = new Date();
  }

  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error("Position cannot be negative");
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  archive(): void {
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  unarchive(): void {
    this.isArchived = false;
    this.updatedAt = new Date();
  }

  delete(): void {
    this.isDeleted = true;
    this.updatedAt = new Date();
  }

  restore(): void {
    this.isDeleted = false;
    this.updatedAt = new Date();
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    user_key: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    position: number;
    is_archived: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  }): Board {
    return new Board(
      row.id,
      row.user_key,
      row.name,
      row.description,
      row.color,
      row.icon,
      row.position,
      row.is_archived,
      row.is_deleted,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    user_key: string;
    name: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    position: number;
    is_archived: boolean;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
  } {
    return {
      id: this.id,
      user_key: this.userId,
      name: this.name,
      description: this.description,
      color: this.color,
      icon: this.icon,
      position: this.position,
      is_archived: this.isArchived,
      is_deleted: this.isDeleted,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
    };
  }
}

