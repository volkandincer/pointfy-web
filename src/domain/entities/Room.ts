/**
 * Room Domain Entity
 * Pure business logic, no external dependencies
 */

export type RoomType = "poker" | "retro";

export class Room {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public name: string,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public isActive: boolean,
    public isPrivate: boolean,
    public roomPassword: string | null,
    public roomType: RoomType
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Room id is required");
    }
    if (!this.code || this.code.trim().length === 0) {
      throw new Error("Room code is required");
    }
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("Room name cannot be empty");
    }
    if (!this.createdBy || this.createdBy.trim().length === 0) {
      throw new Error("Room createdBy is required");
    }
    if (this.isPrivate && (!this.roomPassword || this.roomPassword.length !== 4)) {
      throw new Error("Private room must have a 4-digit password");
    }
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new Error("Room name cannot be empty");
    }
    this.name = newName.trim();
  }

  setPassword(password: string): void {
    if (password.length !== 4 || !/^\d{4}$/.test(password)) {
      throw new Error("Room password must be exactly 4 digits");
    }
    this.roomPassword = password;
    this.isPrivate = true;
  }

  removePassword(): void {
    this.roomPassword = null;
    this.isPrivate = false;
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    code: string;
    name: string;
    created_by_key: string;
    created_by_username?: string;
    created_at: string;
    is_active: boolean;
    is_private: boolean;
    room_password: string | null;
    room_type: RoomType;
  }): Room {
    return new Room(
      row.id,
      row.code,
      row.name,
      row.created_by_key,
      new Date(row.created_at),
      row.is_active,
      row.is_private,
      row.room_password,
      row.room_type
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    code: string;
    name: string;
    created_by_key: string;
    created_at: string;
    is_active: boolean;
    is_private: boolean;
    room_password: string | null;
    room_type: RoomType;
  } {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      created_by_key: this.createdBy,
      created_at: this.createdAt.toISOString(),
      is_active: this.isActive,
      is_private: this.isPrivate,
      room_password: this.roomPassword,
      room_type: this.roomType,
    };
  }
}

