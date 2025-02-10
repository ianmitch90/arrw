'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChatRoom, ChatUser } from '@/types/chat.types';
import { Database } from '@/types/supabase';
import { mockChatProvider } from '@/lib/mock/chat-provider';
import { useMockData } from '@/lib/mock/chat-data';

interface ChatContextType {
  rooms: ChatRoom[];
  currentUser: ChatUser | null;
  isLoading: boolean;
  error: Error | null;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  createRoom: (participantIds: string[]) => Promise<string>;
  typingUsers: Record<string, Set<string>>;
  startTyping: (roomId: string) => void;
  stopTyping: (roomId: string) => void;
}

const ChatContext = createContext<ChatContextType>({
  rooms: [],
  currentUser: null,
  isLoading: true,
  error: null,
  sendMessage: async () => {},
  createRoom: async () => '',
  typingUsers: {},
  startTyping: () => {},
  stopTyping: () => {},
});

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        if (useMockData) {
          const { rooms, currentUser } = mockChatProvider.getMockData();
          setRooms(rooms);
          setCurrentUser(currentUser);
          setIsLoading(false);
          return;
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError(new Error('User not authenticated'));
          return;
        }

        // Get all rooms the user is part of
        const { data: participantRooms, error: roomsError } = await supabase
          .from('chat_participants')
          .select('room_id')
          .eq('user_id', user.id);

        if (roomsError) throw roomsError;

        const roomIds = participantRooms.map(p => p.room_id);

        // Get room details
        const { data: roomsData, error: roomDetailsError } = await supabase
          .from('chat_rooms')
          .select('*')
          .in('id', roomIds);

        if (roomDetailsError) throw roomDetailsError;

        setRooms(roomsData as ChatRoom[]);
        setIsLoading(false);
      } catch (err) {
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadData();
  }, [supabase]);

  // Handle typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (useMockData) {
      mockChatProvider.startTyping(roomId, currentUser?.id || 'user-1');
    }
  }, [currentUser]);

  const stopTyping = useCallback((roomId: string) => {
    if (useMockData) {
      mockChatProvider.stopTyping(roomId, currentUser?.id || 'user-1');
    }
  }, [currentUser]);

  // Handle sending messages
  const sendMessage = useCallback(async (roomId: string, content: string) => {
    if (useMockData) {
      await mockChatProvider.sendMessage(roomId, currentUser?.id || 'user-1', content);
      return;
    }
    // TODO: Implement Supabase message sending
  }, [currentUser]);

  // Handle creating rooms
  const createRoom = useCallback(async (participantIds: string[]) => {
    if (useMockData) {
      // TODO: Implement mock room creation
      return 'mock-room-id';
    }
    // TODO: Implement Supabase room creation
    return '';
  }, []);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        currentUser,
        isLoading,
        error,
        sendMessage,
        createRoom,
        typingUsers: Object.fromEntries(
          Array.from(mockChatProvider.getTypingUsers().entries()).map(([roomId, users]) => [
            roomId,
            new Set(users)
          ])
        ),
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
