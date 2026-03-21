export interface User {
  id: number;
  username: string;
  avatar_url?: string;
  bio?: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'private' | 'group';
  lastMessage?: string;
  lastTime?: string;
  avatarUrl?: string;
}

export interface Message {
  id: number;
  chat_id: string;
  user_id: number;
  nickname: string;
  text: string;
  timestamp: string;
  is_deleted: boolean;
  edited: boolean;
  edited_at?: string | null;
  avatar_url?: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  created_by: number;
  member_count: number;
  members: {
    id: number;
    username: string;
    avatar_url?: string;
    is_creator: boolean;
  }[];
}
