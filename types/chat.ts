import { Database } from './supabase';

export type MessageType = 'text' | 'image' | 'file' | 'voice' | 'system';
export type RoomType = 'direct' | 'group';
export type ParticipantRole = 'owner' | 'admin' | 'member';

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

export interface ChatUser {
  id: string;
  email?: string;
  fullName: string;
  avatarUrl?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  lastSeen?: Date;
}

export interface ChatParticipant extends ChatUser {
  role: ParticipantRole;
  joinedAt: Date;
  lastReadAt: Date;
  unreadCount: number;
  isPinned: boolean;
}

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
  };
  lastMessagePreview?: string;
  lastMessageTimestamp?: Date;
  participants: ChatParticipant[];
}

// Type-safe database types
type DbResult<T> = T extends PromiseLike<infer U> ? U : never;
type DbMessage = DbResult<ReturnType<Database['public']['Tables']['chat_messages']['Row']>>;
type DbRoom = DbResult<ReturnType<Database['public']['Tables']['chat_rooms']['Row']>>;
type DbParticipant = DbResult<ReturnType<Database['public']['Tables']['chat_participants']['Row']>>;

// Conversion functions
export const toMessage = (dbMessage: DbMessage): Message => ({
  id: dbMessage.id,
  roomId: dbMessage.room_id,
  senderId: dbMessage.sender_id,
  messageType: dbMessage.message_type,
  content: dbMessage.content,
  metadata: dbMessage.metadata,
  createdAt: new Date(dbMessage.created_at),
  updatedAt: new Date(dbMessage.updated_at),
  isEdited: dbMessage.is_edited,
  parentId: dbMessage.parent_id
});

export const toChatRoom = (dbRoom: DbRoom, participants: ChatParticipant[]): ChatRoom => ({
  id: dbRoom.id,
  type: dbRoom.type as RoomType,
  name: dbRoom.name,
  createdBy: dbRoom.created_by,
  createdAt: new Date(dbRoom.created_at),
  updatedAt: new Date(dbRoom.updated_at),
  metadata: dbRoom.metadata,
  lastMessagePreview: dbRoom.last_message_preview,
  lastMessageTimestamp: dbRoom.last_message_timestamp ? new Date(dbRoom.last_message_timestamp) : undefined,
  participants
});

// Helper function to get message preview
export const getMessagePreview = (message?: Message, maxLength: number = 50): string => {
  if (!message) return '';
  if (message.messageType === 'image') return '📷 Image';
  if (message.messageType === 'file') return `📎 ${message.metadata?.fileName || 'File'}`;
  return message.content.length > maxLength 
    ? `${message.content.substring(0, maxLength)}...` 
    : message.content;
};
