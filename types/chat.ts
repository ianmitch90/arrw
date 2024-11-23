export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  type: 'text' | 'image' | 'video' | 'file' | 'ephemeral-image' | 'ephemeral-video';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    duration?: number;  // Duration in seconds for videos
    ephemeral?: {
      duration: number;  // Duration in seconds the content is available
      viewedAt?: Date;  // When the content was first viewed
      blurHash?: string; // BlurHash for blurred preview
      expiresAt?: Date;  // When the content will be permanently deleted
    };
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  presence?: {
    typing?: {
      chatId: string;
      timestamp: Date;
    };
    lastActive: Date;
  };
}

export interface ChatRoom {
  id: string;
  type: 'direct' | 'group' | 'global';
  participants: ChatUser[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    groupName?: string;
    groupAvatar?: string;
    description?: string;
    isArchived?: boolean;
    isPinned?: boolean;
  };
}

export interface ChatList {
  rooms: ChatRoom[];
  unreadTotal: number;
  activeRoom?: string;
}

export interface MediaViewerItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  blurHash?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  isEphemeral?: boolean;
  ephemeralDuration?: number;
  viewedAt?: Date;
}

export type MessageStatus = Message['status'];
export type MessageType = Message['type'];
export type UserStatus = ChatUser['status'];
