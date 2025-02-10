import { Database } from './supabase';

/** Type of message that can be sent in a chat */
export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'system';

/** Type of chat room */
export type RoomType = 'direct' | 'group';

/** Role of a participant in a chat room */
export type ParticipantRole = 'owner' | 'admin' | 'member';

/** Represents a chat message */
export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  messageType: MessageType;
  content: string;
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  parentId?: string;
}

/** Represents a user in the chat system */
export interface ChatUser {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  status: 'active' | 'offline' | 'away';
  lastSeen?: Date;
}

/** Represents a participant in a chat room */
export interface ChatParticipant extends ChatUser {
  role: ParticipantRole;
  joinedAt: Date;
  lastReadAt: Date;
  unreadCount: number;
  isPinned: boolean;
}

/** Represents a chat room */
export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  lastMessageTimestamp?: Date;
  messages: Message[];
  participants: ChatParticipant[];
  isArchived: boolean;
  metadata?: {
    description?: string;
    imageUrl?: string;
    groupName?: string;
  };
}
