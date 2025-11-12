export interface Note {
  id: string;
  user_key: string;
  content: string;
  category: string;
  board_id?: string | null;
  created_at?: string;
  updated_at?: string;
  createdAt?: number; // Mobil uyumluluk için
}

export interface NoteInput {
  content: string;
  category: string;
}

