export const FIBONACCI_POINTS = [1, 2, 3, 5, 8, 13, 21] as const;

export interface VoteInfo {
  user_name: string;
  user_key: string;
  point: number | null;
}

export interface VotingSessionState {
  loading: boolean;
  error: string | null;
  remainingTime: number;
  isVotingActive: boolean;
}

export interface TaskInfo {
  id: string;
  title: string;
  description?: string;
  status: "active" | "pending" | "completed";
  room_id: string;
  created_at?: string;
  updated_at?: string;
}
