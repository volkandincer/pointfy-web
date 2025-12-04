/**
 * Vote-related interfaces for Supabase queries with joins
 */

export interface VoteWithTaskAndRoom {
  id: string;
  task_id: string;
  point: number | null;
  created_at: string;
  tasks: {
    id: string;
    title: string;
    description?: string;
    status: string;
    created_at: string;
    room_id: string;
    rooms: {
      id: string;
      name: string;
      code: string;
    };
  } | {
    id: string;
    title: string;
    description?: string;
    status: string;
    created_at: string;
    room_id: string;
    rooms: {
      id: string;
      name: string;
      code: string;
    };
  }[];
}

