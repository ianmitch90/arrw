import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import {
  ChatRoom as ChatRoomType,
  ChatParticipant,
  Message
} from '../types/chat';
import { toChatRoom, toMessage, getMessagePreview } from '../types/chat';
import Chat from './Chat';
import { Card } from '@heroui/react';

interface ChatRoomProps {
  roomId: string;
  userId: string;
}

export default function ChatRoom({ roomId, userId }: ChatRoomProps) {
  const [room, setRoom] = useState<ChatRoomType | null>(null);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchRoomData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch room data
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;

        // Fetch participants
        const { data: participantsData, error: participantsError } =
          await supabase
            .from('chat_participants')
            .select(
              `
            *,
            profiles:user_id (*)
          `
            )
            .eq('room_id', roomId);

        if (participantsError) throw participantsError;

        // Define the participant type with profile
        type ParticipantWithProfile =
          Database['public']['Tables']['chat_participants']['Row'] & {
            profiles: Database['public']['Tables']['profiles']['Row'];
          };

        // Transform participants data with proper typing
        const transformedParticipants: ChatParticipant[] = (
          participantsData as unknown as ParticipantWithProfile[]
        )
          .filter(
            (p): p is ParticipantWithProfile & { user_id: string } =>
              p.user_id !== null
          )
          .map((p) => ({
            id: p.user_id,
            fullName: p.profiles?.full_name || 'Unknown User',
            avatarUrl: p.profiles?.avatar_url || undefined,
            status:
              (p.profiles?.status as ChatParticipant['status']) || 'offline',
            role: p.role as ChatParticipant['role'],
            joinedAt: p.created_at ? new Date(p.created_at) : new Date(),
            lastReadAt: p.last_read_at ? new Date(p.last_read_at) : new Date(),
            unreadCount: 0, // Would need a separate query to calculate this
            isPinned: false, // This would need to be stored in metadata or a separate table
            email: p.profiles?.email
          }));

        // Create the room object
        const chatRoom = toChatRoom(roomData, transformedParticipants);
        setRoom(chatRoom);
        setParticipants(transformedParticipants);
      } catch (err) {
        console.error('Error fetching room data:', err);
        setError('Failed to load chat room');
      } finally {
        setLoading(false);
      }
    };

    fetchRoomData();

    // Subscribe to participant changes
    const participantsChannel = supabase
      .channel(`room-participants:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_participants',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          // Refresh participants when there's a change
          fetchRoomData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
    };
  }, [roomId]);

  // Update last read timestamp for the current user
  const markAsRead = async () => {
    const { error } = await supabase
      .from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', roomId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating last read timestamp:', error);
    }
  };

  if (loading) return <div>Loading chat room...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!room) return <div>Chat room not found</div>;

  return (
    <Card className="chat-room-container">
      <div className="chat-room-header">
        <h2>{room.name || 'Chat Room'}</h2>
        <div className="participant-list">
          {participants.map((participant) => (
            <Card key={participant.id} className="participant">
              {participant.avatarUrl && (
                <img
                  src={participant.avatarUrl}
                  alt={participant.fullName}
                  className="avatar"
                />
              )}
              <span>{participant.fullName}</span>
              <span className={`status ${participant.status}`}></span>
            </Card>
          ))}
        </div>
      </div>

      <div className="chat-content" onClick={markAsRead}>
        <Chat roomId={roomId} userId={userId} />
      </div>
    </Card>
  );
}
