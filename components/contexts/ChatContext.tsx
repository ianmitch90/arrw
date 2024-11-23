'use client';

import React, { createContext, useContext, useState } from 'react';
import { Message, ChatRoom } from '@/types/chat';

interface ChatContextType {
  rooms: ChatRoom[];
  messages: Record<string, Message[]>;
  sendMessage: (roomId: string, content: string, type?: Message['type'], metadata?: Message['metadata']) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([
    {
      id: '1',
      name: 'John Doe',
      lastMessage: 'Hey, how are you?',
      timestamp: new Date(),
      unreadCount: 2,
      avatar: 'https://i.pravatar.cc/150?u=1',
    },
    {
      id: '2',
      name: 'Jane Smith',
      lastMessage: 'The meeting is at 3 PM',
      timestamp: new Date(),
      unreadCount: 0,
      avatar: 'https://i.pravatar.cc/150?u=2',
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: '1',
        content: 'Hey, how are you?',
        senderId: '2',
        timestamp: new Date(),
        type: 'text',
        status: 'read',
      },
    ],
    '2': [],
  });

  const sendMessage = (roomId: string, content: string, type: Message['type'] = 'text', metadata?: Message['metadata']) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      senderId: '1', // Current user
      timestamp: new Date(),
      type,
      metadata,
      status: 'sent',
    };

    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage],
    }));

    setRooms(prev =>
      prev.map(room =>
        room.id === roomId
          ? { ...room, lastMessage: content, timestamp: new Date(), unreadCount: 0 }
          : room
      )
    );
  };

  return (
    <ChatContext.Provider value={{ rooms, messages, sendMessage }}>
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
