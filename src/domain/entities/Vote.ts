/**
 * Vote Domain Entity
 * Pure business logic, no external dependencies
 */

export class Vote {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public readonly taskId: string,
    public readonly userId: string,
    public readonly userName: string,
    public point: number | null,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("Vote id is required");
    }
    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("Vote roomId is required");
    }
    if (!this.taskId || this.taskId.trim().length === 0) {
      throw new Error("Vote taskId is required");
    }
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error("Vote userId is required");
    }
    if (this.point !== null && this.point < 0) {
      throw new Error("Vote point cannot be negative");
    }
  }

  updatePoint(newPoint: number | null): void {
    if (newPoint !== null && newPoint < 0) {
      throw new Error("Vote point cannot be negative");
    }
    this.point = newPoint;
  }

  clearPoint(): void {
    this.point = null;
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    room_id: string;
    task_id: string;
    user_key: string;
    user_name: string;
    point: number | null;
    created_at: string;
  }): Vote {
    return new Vote(
      row.id,
      row.room_id,
      row.task_id,
      row.user_key,
      row.user_name,
      row.point,
      new Date(row.created_at)
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    room_id: string;
    task_id: string;
    user_key: string;
    user_name: string;
    point: number | null;
    created_at: string;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      task_id: this.taskId,
      user_key: this.userId,
      user_name: this.userName,
      point: this.point,
      created_at: this.createdAt.toISOString(),
    };
  }
}

