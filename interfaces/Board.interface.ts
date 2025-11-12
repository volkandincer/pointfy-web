export interface Board {
  id: string;
  user_key: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  position: number;
  is_archived: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  position?: number;
}

