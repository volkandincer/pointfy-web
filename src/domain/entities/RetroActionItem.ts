/**
 * RetroActionItem Domain Entity
 * Pure business logic, no external dependencies
 */

export type RetroActionItemFlag =
  | "high-priority"
  | "medium-priority"
  | "low-priority"
  | "improvement"
  | "research"
  | "general"
  | "custom";

export class RetroActionItem {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public content: string,
    public readonly createdBy: string,
    public readonly createdByUsername: string,
    public isCompleted: boolean,
    public completedAt: Date | null,
    public position: number,
    public flag: RetroActionItemFlag | null,
    public customFlag: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("RetroActionItem id is required");
    }
    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("RetroActionItem roomId is required");
    }
    if (!this.content || this.content.trim().length === 0) {
      throw new Error("RetroActionItem content cannot be empty");
    }
    if (!this.createdBy || this.createdBy.trim().length === 0) {
      throw new Error("RetroActionItem createdBy is required");
    }
    if (this.position < 0) {
      throw new Error("Position cannot be negative");
    }
  }

  updateContent(newContent: string): void {
    if (!newContent || newContent.trim().length === 0) {
      throw new Error("RetroActionItem content cannot be empty");
    }
    this.content = newContent.trim();
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    if (this.isCompleted) {
      return; // Already completed
    }
    this.isCompleted = true;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  markAsIncomplete(): void {
    if (!this.isCompleted) {
      return; // Already incomplete
    }
    this.isCompleted = false;
    this.completedAt = null;
    this.updatedAt = new Date();
  }

  setFlag(flag: RetroActionItemFlag | null): void {
    this.flag = flag;
    if (flag !== "custom") {
      this.customFlag = null;
    }
    this.updatedAt = new Date();
  }

  setCustomFlag(flagName: string): void {
    if (!flagName || flagName.trim().length === 0) {
      throw new Error("Custom flag name cannot be empty");
    }
    this.flag = "custom";
    this.customFlag = flagName.trim();
    this.updatedAt = new Date();
  }

  updatePosition(newPosition: number): void {
    if (newPosition < 0) {
      throw new Error("Position cannot be negative");
    }
    this.position = newPosition;
    this.updatedAt = new Date();
  }

  // Factory method to create from database row
  static fromRow(row: {
    id: string;
    room_id: string;
    content: string;
    created_by_key: string;
    created_by_username: string;
    is_completed: boolean;
    completed_at: string | null;
    position: number;
    flag: RetroActionItemFlag | null;
    custom_flag: string | null;
    created_at: string;
    updated_at: string;
  }): RetroActionItem {
    return new RetroActionItem(
      row.id,
      row.room_id,
      row.content,
      row.created_by_key,
      row.created_by_username,
      row.is_completed,
      row.completed_at ? new Date(row.completed_at) : null,
      row.position,
      row.flag,
      row.custom_flag,
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  // Convert to database row format
  toRow(): {
    id: string;
    room_id: string;
    content: string;
    created_by_key: string;
    created_by_username: string;
    is_completed: boolean;
    completed_at: string | null;
    position: number;
    flag: RetroActionItemFlag | null;
    custom_flag: string | null;
    created_at: string;
    updated_at: string;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      content: this.content,
      created_by_key: this.createdBy,
      created_by_username: this.createdByUsername,
      is_completed: this.isCompleted,
      completed_at: this.completedAt ? this.completedAt.toISOString() : null,
      position: this.position,
      flag: this.flag,
      custom_flag: this.customFlag,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt.toISOString(),
    };
  }
}

