export interface PersonalTask {
  id: string;
  user_key: string;
  title: string;
  description: string | null;
  category: string;
  priority: number;
  created_at?: string;
}

export interface PersonalTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: number;
}
