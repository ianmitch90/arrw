'use client';

import React, { createContext, useContext, useState } from 'react';
import { Message, ChatRoom, ChatUser } from '@/types/chat';

interface ChatContextType {
  rooms: ChatRoom[];
  messages: Message[];
  activeRoom: string | null;
  sendMessage: (message: Partial<Message>) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

// Stub data
const stubRooms: ChatRoom[] = [
  {
    id: '1',
    type: 'direct',
    name: 'Alice Johnson',
    participants: [
      {
        id: 'alice',
        name: 'Alice Johnson',
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
        status: 'online',
        lastSeen: new Date()
      }
    ],
    lastMessage: {
      id: 'msg1',
      roomId: '1',
      senderId: 'alice',
      content: 'Hey, how are you?',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      type: 'text'
    }
  },
  {
    id: '2',
    type: 'group',
    name: 'Design Team',
    participants: [
      {
        id: 'bob',
        name: 'Bob Smith',
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
        status: 'offline',
        lastSeen: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'carol',
        name: 'Carol White',
        avatarUrl: 'https://i.pravatar.cc/150?u=carol',
        status: 'online',
        lastSeen: new Date()
      }
    ],
    metadata: {
      groupName: 'Design Team',
      groupAvatar: 'https://i.pravatar.cc/150?u=design-team'
    },
    lastMessage: {
      id: 'msg4',
      roomId: '2',
      senderId: 'bob',
      content: 'Updated the latest mockups',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      type: 'text'
    }
  }
];

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
    roomId: '1',
    senderId: 'current-user',
    content: "I'm doing great! Just finished the new feature.",
    timestamp: new Date(Date.now() - 1000 * 60 * 4),
    type: 'text'
  },
  {
    id: 'msg3',
    roomId: '1',
    senderId: 'alice',
    content: 'That sounds awesome! Can you show me?',
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
    type: 'text'
  },
  {
    id: 'msg4',
    roomId: '2',
    senderId: 'bob',
    content: 'Updated the latest mockups',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    type: 'text'
  },
  {
    id: 'msg5',
    roomId: '2',
    senderId: 'carol',
    content: 'These look great! Love the new color scheme.',
    timestamp: new Date(Date.now() - 1000 * 60 * 9),
    type: 'text'
  }
];

const mockUsers: ChatUser[] = [
  {
    id: 'user1',
    name: 'John Doe',
    avatarUrl: 'https://i.pravatar.cc/150?u=1',
    status: 'online',
    lastSeen: new Date()
  },
  {
    id: 'user2',
    name: 'Jane Smith',
    avatarUrl: 'https://i.pravatar.cc/150?u=2',
    status: 'offline',
    lastSeen: new Date()
  },
  {
    id: 'current-user',
    name: 'You',
    avatarUrl: 'https://i.pravatar.cc/150?u=me',
    status: 'online',
    lastSeen: new Date()
  }
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  
  const [rooms] = useState<ChatRoom[]>(stubRooms);
  const [messages, setMessages] = useState<Message[]>(stubMessages);

  const sendMessage = (messageData: Partial<Message>) => {
    const newMessage: Message = {
      id: `msg${messages.length + 1}`,
      timestamp: new Date(),
      type: 'text',
      ...messageData
    };

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <ChatContext.Provider value={{ rooms, messages, activeRoom, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
