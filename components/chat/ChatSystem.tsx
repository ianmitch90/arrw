import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface ChatRoom {
  id: string;
  name: string;
  type: 'location' | 'direct' | 'group';
  participants: string[];
}

export function ChatSystem() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const { state: locationState } = useLocation();

  useEffect(() => {
    if (!activeRoom) return;

    // Subscribe to new messages
    const subscription = supabase
      .channel(`room:${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${activeRoom}`
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [activeRoom]);

  const sendMessage = async (content: string) => {
    if (!activeRoom) return;

    const { error } = await supabase.from('messages').insert({
      room_id: activeRoom,
      content,
      location: locationState.currentLocation
    });

    if (error) throw error;
  };

  // Component JSX coming in next step
}
