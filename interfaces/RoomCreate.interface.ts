export type RoomType = "poker" | "retro" | "refinement" | "standup";

export interface RoomSettings {
  maxParticipants: number;
  isPrivate: boolean;
  roomPassword: string;
  allowSpectators: boolean;
  autoReveal: boolean;
}

export interface RoomCreateInput {
  name: string;
  description?: string;
  roomType: RoomType;
  settings: RoomSettings;
}

