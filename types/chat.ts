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
  status: Database['public']['Enums']['user_status'];
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
  type: RoomType;
  name: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    groupName?: string;
    groupAvatar?: string;
    location?: Database['public']['Tables']['places']['Row']['location'];
  };
  lastMessagePreview?: string;
  lastMessageTimestamp?: Date;
  participants: ChatParticipant[];
}

// Type-safe database types
type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
type DbMessage = Database['public']['Tables']['chat_messages']['Row'];
type DbRoom = Database['public']['Tables']['chat_rooms']['Row'];
type DbParticipant = Database['public']['Tables']['chat_participants']['Row'];

/**
 * Converts a database message to a client Message object
 * @param dbMessage - The message from the database
 * @returns A client-side Message object
 */
export const toMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  roomId: dbMessage.room_id,
  senderId: dbMessage.sender_id,
  messageType: dbMessage.message_type as MessageType,
  content: dbMessage.content,
  metadata: dbMessage.metadata as Message['metadata'],
  createdAt: new Date(dbMessage.created_at),
  updatedAt: new Date(dbMessage.updated_at),
  isEdited: dbMessage.is_edited,
  parentId: dbMessage.parent_id
});

/**
 * Converts a database room to a client ChatRoom object
 * @param dbRoom - The room from the database
 * @param participants - The participants in the room
 * @returns A client-side ChatRoom object
 */
export const toChatRoom = (dbRoom: DbRoom, participants: ChatParticipant[]): ChatRoom => ({
  id: dbRoom.id,
  type: dbRoom.type as RoomType,
  name: dbRoom.name,
  createdBy: dbRoom.created_by,
  createdAt: new Date(dbRoom.created_at),
  updatedAt: new Date(dbRoom.updated_at),
  metadata: dbRoom.metadata as ChatRoom['metadata'],
  lastMessagePreview: dbRoom.last_message_preview,
  lastMessageTimestamp: dbRoom.last_message_timestamp ? new Date(dbRoom.last_message_timestamp) : undefined,
  participants
});

/**
 * Gets a preview of a message suitable for display in chat lists
 * @param message - The message to get a preview for
 * @param maxLength - Maximum length of the preview
 * @returns A string preview of the message
 */
export const getMessagePreview = (message?: Message, maxLength: number = 50): string => {
  if (!message) return '';
  if (message.messageType === 'image') return '📷 Image';
  if (message.messageType === 'file') return `📎 ${message.metadata?.fileName || 'File'}`;
  return message.content.length > maxLength 
    ? `${message.content.substring(0, maxLength)}...` 
    : message.content;
};
