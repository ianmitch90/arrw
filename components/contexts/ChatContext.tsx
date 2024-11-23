'use client';

import React, { createContext, useContext, useState } from 'react';
import { Message, ChatRoom, ChatUser } from '@/types/chat';
import { Profile } from '@/types/profile';
import { User } from '@/types/user';

interface ChatContextType {
  rooms: ChatRoom[];
  messages: Message[];
  activeRoom: string | null;
  sendMessage: (message: Partial<Message>) => void;
  users: (User & { profile?: Profile })[];
}

const ChatContext = createContext<ChatContextType | null>(null);

// Stub users with profiles
const stubUsers: (User & { profile?: Profile })[] = [
  {
    id: 'alice',
    email: 'alice@example.com',
    role: 'subscriber',
    username: 'AliceJ',
    created_at: new Date().toISOString(),
    password_hash: '',
    is_email_verified: true,
    is_phone_verified: false,
    two_factor_enabled: false,
    account_status: 'active',
    preferred_language: 'en',
    profile: {
      id: 'alice-profile',
      username: 'AliceJ',
      display_name: 'Alice',
      avatar_url: 'https://i.pravatar.cc/150?u=alice',
      height: 170,
      weight: 61,
      body_type: 'Athletic',
      sexual_positions: ['Versatile'],
      is_verified: true,
      last_active: new Date().toISOString()
    }
  },
  {
    id: 'bob',
    email: 'bob@example.com',
    role: 'anon',
    created_at: new Date().toISOString(),
    password_hash: '',
    is_email_verified: false,
    is_phone_verified: false,
    two_factor_enabled: false,
    account_status: 'active',
    preferred_language: 'en',
    profile: {
      id: 'bob-profile',
      avatar_url: 'https://i.pravatar.cc/150?u=bob',
      height: 183,
      weight: 79,
      body_type: 'Muscular',
      sexual_positions: ['Top'],
      is_verified: false,
      last_active: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    }
  },
  {
    id: 'charlie',
    email: 'charlie@example.com',
    role: 'subscriber',
    username: 'CharlieD',
    created_at: new Date().toISOString(),
    password_hash: '',
    is_email_verified: true,
    is_phone_verified: true,
    two_factor_enabled: true,
    account_status: 'active',
    preferred_language: 'en',
    profile: {
      id: 'charlie-profile',
      username: 'CharlieD',
      display_name: 'Charlie',
      avatar_url: 'https://i.pravatar.cc/150?u=charlie',
      height: 175,
      weight: 70,
      body_type: 'Slim',
      sexual_positions: ['Bottom'],
      is_verified: true,
      last_active: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    }
  }
];

// Mock chat users from stub users
const chatUsers: ChatUser[] = stubUsers.map(user => ({
  id: user.id,
  name: user.profile?.display_name || user.username || 'Anonymous User',
  avatarUrl: user.profile?.avatar_url,
  status: 'online',
  lastSeen: new Date(user.profile?.last_active || Date.now())
}));

// Stub rooms with chat users
const stubRooms: ChatRoom[] = [
  {
    id: '1',
    type: 'direct',
    name: 'Alice Johnson',
    participants: [chatUsers[0]],
    lastMessage: {
      id: 'msg1',
      roomId: '1',
      senderId: 'alice',
      content: 'Hey, how are you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      type: 'text'
    }
  },
  {
    id: '2',
    type: 'direct',
    name: 'Bob Anonymous',
    participants: [chatUsers[1]],
    lastMessage: {
      id: 'msg2',
      roomId: '2',
      senderId: 'bob',
      content: 'Looking to meet up?',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      type: 'text'
    }
  },
  {
    id: '3',
    type: 'direct',
    name: 'Charlie Davis',
    participants: [chatUsers[2]],
    lastMessage: {
      id: 'msg3',
      roomId: '3',
      senderId: 'charlie',
      content: 'What are you up to tonight?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15),
      type: 'text'
    }
  }
];

// Stub messages
const stubMessages: Message[] = [
  {
    id: 'msg1',
    roomId: '1',
    senderId: 'alice',
    content: 'Hey, how are you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    type: 'text'
  },
  {
    id: 'msg2',
    roomId: '2',
    senderId: 'bob',
    content: 'Looking to meet up?',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    type: 'text'
  },
  {
    id: 'msg3',
    roomId: '3',
    senderId: 'charlie',
    content: 'What are you up to tonight?',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    type: 'text'
  },
  {
    id: 'msg4',
    roomId: '1',
    senderId: 'current-user',
    content: 'I\'m doing great! How about you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    type: 'text'
  },
  {
    id: 'msg5',
    roomId: '2',
    senderId: 'current-user',
    content: 'Sure, what time works for you?',
    timestamp: new Date(Date.now() - 1000 * 60 * 29),
    type: 'text'
  },
  {
    id: 'msg6',
    roomId: '3',
    senderId: 'current-user',
    content: 'Just finished work, thinking about grabbing dinner',
    timestamp: new Date(Date.now() - 1000 * 60 * 14),
    type: 'text'
  }
];

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [rooms] = useState<ChatRoom[]>(stubRooms);
  const [messages] = useState<Message[]>(stubMessages);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [users] = useState(stubUsers);

  const sendMessage = (message: Partial<Message>) => {
    const newMessage: Message = {
      id: `msg${messages.length + 1}`,
      timestamp: new Date(),
      type: 'text',
      ...message
    };

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatContext.Provider value={{ rooms, messages, activeRoom, sendMessage, users }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
