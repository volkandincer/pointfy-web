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
    public roomType: RoomType,
    public retroTimerDuration: number | null = null,
    public retroTimerStartedAt: Date | null = null,
    public retroTimerEndedAt: Date | null = null
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

  // Retro Timer methods
  startRetroTimer(durationSeconds: number): void {
    if (this.roomType !== "retro") {
      throw new Error("Timer can only be started for retro rooms");
    }
    if (durationSeconds <= 0) {
      throw new Error("Timer duration must be greater than 0");
    }
    this.retroTimerDuration = durationSeconds;
    this.retroTimerStartedAt = new Date();
    this.retroTimerEndedAt = null;
  }

  stopRetroTimer(): void {
    if (this.roomType !== "retro") {
      throw new Error("Timer can only be stopped for retro rooms");
    }
    this.retroTimerEndedAt = new Date();
    this.retroTimerDuration = null;
    this.retroTimerStartedAt = null;
  }

  getRemainingSeconds(): number {
    if (
      !this.retroTimerStartedAt ||
      !this.retroTimerDuration ||
      this.retroTimerEndedAt
    ) {
      return 0;
    }

    const startTime = this.retroTimerStartedAt.getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    return Math.max(0, this.retroTimerDuration - elapsedSeconds);
  }

  isTimerActive(): boolean {
    return this.getRemainingSeconds() > 0;
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
    retro_timer_duration?: number | null;
    retro_timer_started_at?: string | null;
    retro_timer_ended_at?: string | null;
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
      row.room_type,
      row.retro_timer_duration ?? null,
      row.retro_timer_started_at ? new Date(row.retro_timer_started_at) : null,
      row.retro_timer_ended_at ? new Date(row.retro_timer_ended_at) : null
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

