/**
 * RetroSession Domain Entity
 * Pure business logic, no external dependencies
 */

export class RetroSession {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public readonly createdAt: Date,
    public completedAt: Date | null,
    public isActive: boolean
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("RetroSession ID is required");
    }

    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (this.completedAt && this.completedAt < this.createdAt) {
      throw new Error("Completed date cannot be before creation date");
    }

    if (this.completedAt && this.isActive) {
      throw new Error("Active session cannot have a completed date");
    }
  }

  complete(): RetroSession {
    if (this.completedAt) {
      throw new Error("Session is already completed");
    }

    return new RetroSession(
      this.id,
      this.roomId,
      this.createdAt,
      new Date(),
      false
    );
  }

  static fromRow(row: {
    id: string;
    room_id: string;
    created_at: string;
    completed_at: string | null;
    is_active: boolean;
  }): RetroSession {
    return new RetroSession(
      row.id,
      row.room_id,
      new Date(row.created_at),
      row.completed_at ? new Date(row.completed_at) : null,
      row.is_active
    );
  }

  toRow(): {
    id: string;
    room_id: string;
    created_at: string;
    completed_at: string | null;
    is_active: boolean;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      created_at: this.createdAt.toISOString(),
      completed_at: this.completedAt ? this.completedAt.toISOString() : null,
      is_active: this.isActive,
    };
  }
}

