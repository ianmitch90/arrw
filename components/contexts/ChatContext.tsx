'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChatRoom, Message, ChatParticipant, toMessage, toChatRoom } from '@/types/chat';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

interface ChatContextType {
  rooms: ChatRoom[];
  activeRoom: string | null;
  setActiveRoom: (roomId: string | null) => void;
  sendMessage: (roomId: string, content: string, type?: 'text' | 'image' | 'file' | 'voice') => Promise<void>;
  markAsRead: (roomId: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClientComponentClient<Database>();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  // Fetch rooms and their participants
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        
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

        // Get participants for each room
        const roomsWithParticipants = await Promise.all(
          roomsData.map(async (room) => {
            const { data: participants, error: participantsError } = await supabase
              .from('chat_participants')
              .select('*, users:user_id(*)')
              .eq('room_id', room.id);

            if (participantsError) throw participantsError;

            const chatParticipants: ChatParticipant[] = participants.map(p => ({
              id: p.user_id,
              fullName: p.users.full_name,
              avatarUrl: p.users.avatar_url,
              status: p.users.status,
              lastSeen: p.users.last_seen ? new Date(p.users.last_seen) : undefined,
              role: p.role,
              joinedAt: new Date(p.joined_at),
              lastReadAt: new Date(p.last_read_at),
              unreadCount: p.unread_count,
              isPinned: p.is_pinned
            }));

            return toChatRoom(room, chatParticipants);
          })
        );

        setRooms(roomsWithParticipants);
        setError(null);
      } catch (err) {
        console.error('Error fetching rooms:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch rooms'));
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [supabase]);

  // Set up realtime subscription
  useEffect(() => {
    const newChannel = supabase.channel('chat_updates')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=in.(${rooms.map(r => r.id).join(',')})`
      }, async (payload) => {
        // Update rooms with new message
        const newMessage = payload.new as any;
        const roomIndex = rooms.findIndex(r => r.id === newMessage.room_id);
        
        if (roomIndex >= 0) {
          const updatedRooms = [...rooms];
          updatedRooms[roomIndex] = {
            ...updatedRooms[roomIndex],
            lastMessagePreview: newMessage.content,
            lastMessageTimestamp: new Date(newMessage.created_at)
          };
          setRooms(updatedRooms);
        }
      })
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [rooms, supabase]);

  const sendMessage = async (roomId: string, content: string, type: 'text' | 'image' | 'file' | 'voice' = 'text') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        room_id: roomId,
        sender_id: user.id,
        message_type: type,
        content,
        metadata: type !== 'text' ? { fileName: content } : null
      });

    if (error) throw error;
  };

  const markAsRead = async (roomId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .rpc('mark_messages_read', { room_id: roomId });

    if (error) throw error;

    // Update local state
    setRooms(rooms.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          participants: room.participants.map(p => 
            p.id === user.id ? { ...p, unreadCount: 0, lastReadAt: new Date() } : p
          )
        };
      }
      return room;
    }));
  };

  return (
    <ChatContext.Provider value={{
      rooms,
      activeRoom,
      setActiveRoom,
      sendMessage,
      markAsRead,
      loading,
      error
    }}>
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
