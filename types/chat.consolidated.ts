/**
 * Consolidated Chat Types
 * 
 * This file demonstrates the consolidated approach to type definitions
 * by leveraging the centralized database type aliases and providing
 * clear domain-specific extensions and conversion utilities.
 */

import { DbChatMessage, DbChatRoom, DbChatParticipant } from './db-aliases';

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

/**
 * Converts a database message to a client Message object
 * @param dbMessage - The message from the database
 * @returns A client-side Message object
 */
export const toMessage = (dbMessage: DbChatMessage): Message => ({
  id: dbMessage.id,
  roomId: dbMessage.room_id || '',
  senderId: dbMessage.sender_id || '',
  messageType: dbMessage.message_type as MessageType,
  content: dbMessage.content || '',
  metadata: dbMessage.metadata as Message['metadata'],
  createdAt: dbMessage.created_at ? new Date(dbMessage.created_at) : new Date(),
  updatedAt: dbMessage.updated_at ? new Date(dbMessage.updated_at) : new Date(),
  isEdited: dbMessage.is_edited || false,
  parentId: dbMessage.parent_id || undefined
});

/**
 * Converts a database room to a client ChatRoom object
 * @param dbRoom - The room from the database
 * @param participants - The participants in the room
 * @returns A client-side ChatRoom object
 */
export const toChatRoom = (
  dbRoom: DbChatRoom,
  participants: ChatParticipant[]
): ChatRoom => ({
  id: dbRoom.id,
  type: dbRoom.type as RoomType,
  name: dbRoom.name || '',
  createdBy: dbRoom.created_by || '',
  createdAt: new Date(dbRoom.created_at || Date.now()),
  updatedAt: new Date(dbRoom.updated_at || Date.now()),
  metadata: dbRoom.metadata as ChatRoom['metadata'],
  lastMessagePreview: dbRoom.last_message_preview || undefined,
  lastMessageTimestamp: dbRoom.last_message_timestamp
    ? new Date(dbRoom.last_message_timestamp)
    : undefined,
  participants,
  messages: [],
  isArchived: false
});

/**
 * Gets a preview of a message suitable for display in chat lists
 * @param message - The message to get a preview for
 * @param maxLength - Maximum length of the preview
 * @returns A string preview of the message
 */
export const getMessagePreview = (
  message?: Message,
  maxLength: number = 50
): string => {
  if (!message) return '';
  if (message.messageType === 'image') return '📷 Image';
  if (message.messageType === 'file')
    return `📎 ${message.metadata?.fileName || 'File'}`;
  return message.content.length > maxLength
    ? `${message.content.substring(0, maxLength)}...`
    : message.content;
};