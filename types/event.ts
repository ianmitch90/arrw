import { Message } from './index';

export interface Chatroom {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  is_private: boolean;
  is_archived: boolean;
  creator_id: string;
  participants: string[];
  messages: Message[];
}
