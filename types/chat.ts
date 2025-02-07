import { Database } from './supabase';
import type { Message, ChatRoom, ChatUser, ChatParticipant, MessageType, RoomType, ParticipantRole } from './chat.types';

export type {
  Message,
  ChatRoom,
  ChatUser,
  ChatParticipant,
  MessageType,
  RoomType,
  ParticipantRole,
};

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
