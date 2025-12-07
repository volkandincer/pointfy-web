export interface PersonalTask {
  id: string;
  user_key: string;
  title: string;
  description: string | null;
  category: string;
  priority: number;
  board_id?: string | null;
  created_at?: string;
  jira_issue_key?: string | null;
  jira_issue_url?: string | null;
}

export interface PersonalTaskInput {
  title: string;
  description?: string;
  category?: string;
  priority?: number;
  board_id?: string | null;
}
