export type RetroActionItemFlag =
  | "high-priority"
  | "medium-priority"
  | "low-priority"
  | "improvement"
  | "research"
  | "general"
  | "custom";

export interface RetroActionItem {
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
}

export interface RetroActionItemInput {
  content: string;
  flag?: RetroActionItemFlag | null;
  custom_flag?: string | null;
}

export interface RoomCustomFlag {
  id: string;
  room_id: string;
  flag_name: string;
  flag_color: string;
  created_by_key: string;
  created_at: string;
}

