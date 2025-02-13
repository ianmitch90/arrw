'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChatRoom, ChatUser } from '@/types/chat.types';
import { Database } from '@/types/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError(new Error('User not authenticated'));
          return;
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setCurrentUser({
          id: profile.id,
          email: user.email || '',
          fullName: profile.full_name || '',
          avatarUrl: profile.avatar_url || '',
          status: profile.presence_status || 'offline'
        });

        // Get all rooms the user is part of with messages and participants
        const { data: rooms, error: roomsError } = await supabase
          .from('chat_rooms')
          .select(`
            *,
            chat_participants!inner (user_id),
            chat_messages (*, sender:profiles(*))
          `)
          .eq('chat_participants.user_id', user.id)
          .order('updated_at', { ascending: false })
          .order('chat_messages.created_at', { foreignTable: 'chat_messages', ascending: true });

        if (roomsError) throw roomsError;

        // Transform the data to match our ChatRoom type
        const transformedRooms = rooms.map(room => ({
          id: room.id,
          name: room.name || '',
          type: room.type,
          createdBy: room.created_by,
          createdAt: new Date(room.created_at),
          updatedAt: new Date(room.updated_at),
          messages: room.chat_messages.map(msg => ({
            id: msg.id,
            roomId: msg.room_id,
            senderId: msg.sender_id,
            messageType: msg.metadata?.type || 'text',
            content: msg.content,
            metadata: msg.metadata,
            createdAt: new Date(msg.created_at),
            updatedAt: new Date(msg.updated_at),
            isEdited: msg.created_at !== msg.updated_at,
            parentId: msg.parent_id
          })),
          participants: room.chat_participants.map(p => ({
            id: p.user_id,
            role: p.role,
            joinedAt: new Date(p.created_at),
            lastReadAt: p.last_read_at ? new Date(p.last_read_at) : new Date(),
            unreadCount: 0, // TODO: Calculate this
            isPinned: false // TODO: Implement pinned chats
          }))
        }));

        setRooms(transformedRooms);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading chat data:', err);
        setError(err as Error);
        setIsLoading(false);
      }
    };

    loadData();

    // Subscribe to real-time updates
    const roomsChannel = supabase.channel('chat_updates')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'chat_messages'
      }, payload => {
        // Handle new messages
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new;
          setRooms(prevRooms => {
            return prevRooms.map(room => {
              if (room.id === newMessage.room_id) {
                return {
                  ...room,
                  messages: [...room.messages, {
                    id: newMessage.id,
                    roomId: newMessage.room_id,
                    senderId: newMessage.sender_id,
                    messageType: newMessage.metadata?.type || 'text',
                    content: newMessage.content,
                    metadata: newMessage.metadata,
                    createdAt: new Date(newMessage.created_at),
                    updatedAt: new Date(newMessage.updated_at),
                    isEdited: false,
                    parentId: newMessage.parent_id
                  }]
                };
              }
              return room;
            });
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
    };
  }, [supabase]);

  // Handle typing indicators
  const startTyping = useCallback((roomId: string) => {
    if (!currentUser) return;
    supabase.channel(`room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id }
      });
  }, [currentUser, supabase]);

  const stopTyping = useCallback((roomId: string) => {
    if (!currentUser) return;
    supabase.channel(`room:${roomId}`)
      .send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: { userId: currentUser.id }
      });
  }, [currentUser, supabase]);

  // Handle sending messages
  const sendMessage = useCallback(async (roomId: string, content: string) => {
    if (!currentUser) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: currentUser.id,
        content,
        metadata: { type: 'text' }
      });

    if (error) throw error;
  }, [currentUser, supabase]);

  // Handle creating rooms
  const createRoom = useCallback(async (participantIds: string[]) => {
    if (!currentUser) throw new Error('User not authenticated');

    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        type: participantIds.length === 1 ? 'direct' : 'group',
        created_by: currentUser.id
      })
      .select()
      .single();

    if (roomError) throw roomError;

    // Add participants
    const participants = [
      currentUser.id,
      ...participantIds
    ].map(userId => ({
      room_id: room.id,
      user_id: userId,
      role: userId === currentUser.id ? 'owner' : 'member'
    }));

    const { error: participantsError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantsError) throw participantsError;

    return room.id;
  }, [currentUser, supabase]);

  return (
    <ChatContext.Provider
      value={{
        rooms,
        currentUser,
        isLoading,
        error,
        sendMessage,
        createRoom,
        typingUsers: {},
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
