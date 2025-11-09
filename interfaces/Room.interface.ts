export interface RoomInfo {
  id: string;
  name: string;
  code: string;
  created_at?: string;
  created_by_username?: string;
  is_active?: boolean;
  is_private?: boolean;
  room_password?: string;
  room_type?: string;
}
