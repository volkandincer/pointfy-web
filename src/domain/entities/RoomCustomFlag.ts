/**
 * RoomCustomFlag Domain Entity
 * Represents a custom flag for retro action items in a room
 */

export class RoomCustomFlag {
  constructor(
    public readonly id: string,
    public readonly roomId: string,
    public readonly flagName: string,
    public readonly flagColor: string,
    public readonly createdBy: string,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("RoomCustomFlag ID is required");
    }

    if (!this.roomId || this.roomId.trim().length === 0) {
      throw new Error("Room ID is required");
    }

    if (!this.flagName || this.flagName.trim().length === 0) {
      throw new Error("Flag name is required");
    }

    if (!this.flagColor || this.flagColor.trim().length === 0) {
      throw new Error("Flag color is required");
    }

    if (!this.createdBy || this.createdBy.trim().length === 0) {
      throw new Error("Created by is required");
    }
  }

  static fromRow(row: {
    id: string;
    room_id: string;
    flag_name: string;
    flag_color: string;
    created_by_key: string;
    created_at: string;
  }): RoomCustomFlag {
    return new RoomCustomFlag(
      row.id,
      row.room_id,
      row.flag_name,
      row.flag_color,
      row.created_by_key,
      new Date(row.created_at)
    );
  }

  toRow(): {
    id: string;
    room_id: string;
    flag_name: string;
    flag_color: string;
    created_by_key: string;
    created_at: string;
  } {
    return {
      id: this.id,
      room_id: this.roomId,
      flag_name: this.flagName,
      flag_color: this.flagColor,
      created_by_key: this.createdBy,
      created_at: this.createdAt.toISOString(),
    };
  }
}

