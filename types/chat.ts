export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    thumbnailUrl?: string;
  };
}

export interface ChatUser {
  id: string;
  name: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
}

export interface ChatRoom {
  id: string;
  type: 'direct' | 'group';
  name: string;
  participants: ChatUser[];
  lastMessage?: Message;
  metadata?: {
    groupName?: string;
    groupAvatar?: string;
  };
}
