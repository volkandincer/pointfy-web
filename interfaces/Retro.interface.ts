export type RetroCategory = "mad" | "sad" | "glad";

export interface RetroCard {
  id: string;
  room_id: string;
  user_key: string;
  user_name: string;
  category: RetroCategory;
  content: string;
  is_revealed: boolean;
  created_at: string;
  updated_at: string;
}

export interface RetroCardInput {
  category: RetroCategory;
  content: string;
}
