import { Message } from './chat.types';

export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  created_by: string;
  is_private: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  city: string;
  max_participants: number;
  messages: Message[];
}
