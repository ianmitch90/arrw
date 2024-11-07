import { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  room_id: string;
  created_at: string;
  sender: {
    id: string;
    name: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'location' | 'image' | 'video';
  data: any;
}

export interface PresenceState {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  presence_ref?: string;
}

export interface RealtimeConfig {
  enablePresence: boolean;
  enableLocationTracking: boolean;
}

export interface RealtimeChannelConfig {
  broadcast: {
    self: boolean;
  };
  presence: {
    key: string;
  };
}

export interface RealtimePresenceJoinPayload<T = any> {
  key: string;
  currentPresences: T[];
  newPresences: T[];
}

export interface RealtimePresenceLeavePayload<T = any> {
  key: string;
  currentPresences: T[];
  leftPresences: T[];
}

export type RealtimeMessageHandler = (message: Message) => void;
export type PresenceUpdateHandler = (state: PresenceState) => void;

export interface UserPresence extends PresenceState {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}
