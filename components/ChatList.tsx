import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ChatRoom, ChatParticipant, ParticipantRole } from '../types/chat';
import { toChatRoom, getMessagePreview } from '../types/chat';
import { Database } from '@/types/supabase';

interface ChatListProps {
  userId: string;
  onSelectRoom: (roomId: string) => void;
}

export default function ChatList({ userId, onSelectRoom }: ChatListProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient<Database>();

  useEffect(() => {
    const fetchChatRooms = async () => {
      setLoading(true);
      setError(null);

      try {
        // First get all rooms the user is participating in
        const { data: participations, error: participationsError } =
          await supabase
            .from('chat_participants')
            .select('room_id')
            .eq('user_id', userId);

        if (participationsError) throw participationsError;

        if (!participations || participations.length === 0) {
          setRooms([]);
          setLoading(false);
          return;
        }

        const roomIds = participations.map((p) => p.room_id);

        // Fetch room data with last message preview
        const { data: roomsData, error: roomsError } = await supabase
          .from('chat_rooms')
          .select('*, chat_participants!inner(*)')
          .in('id', roomIds)
          .order('updated_at', { ascending: false });

        if (roomsError) throw roomsError;

        // For each room, fetch participants with user profiles
        const roomsWithParticipants = await Promise.all(
          roomsData.map(async (room) => {
            type ParticipantWithProfile =
              Database['public']['Tables']['chat_participants']['Row'] & {
                profiles: Database['public']['Tables']['profiles']['Row'];
              };

            const { data: participants, error: participantsError } =
              await supabase
                .from('chat_participants')
                .select(
                  `
              *,
              profiles:user_id (*)
            `
                )
                .eq('room_id', room.id);

            if (participantsError) throw participantsError;

            // Transform participants data with proper typing
            const transformedParticipants: ChatParticipant[] = (
              participants as unknown as ParticipantWithProfile[]
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
                  (p.profiles?.status as ChatParticipant['status']) ||
                  'offline',
                role: p.role as ParticipantRole,
                joinedAt: p.created_at ? new Date(p.created_at) : new Date(),
                lastReadAt: p.last_read_at
                  ? new Date(p.last_read_at)
                  : new Date(),
                unreadCount: 0, // Default to 0 since unread_count is not in DB yet
                isPinned: false, // Default to false since is_pinned is not in DB yet
                email: p.profiles?.email
              }));

            return toChatRoom(room, transformedParticipants);
          })
        );

        setRooms(roomsWithParticipants);
      } catch (err) {
        console.error('Error fetching chat rooms:', err);
        setError('Failed to load chat rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchChatRooms();

    // Subscribe to room updates
    const roomsChannel = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_rooms' },
        (payload) => {
          // Refresh rooms when there's a change
          fetchChatRooms();
        }
      )
      .subscribe();

    // Subscribe to new messages to update previews
    const messagesChannel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload) => {
          // Refresh rooms to update message previews
          fetchChatRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId]);

  // Get other participants for direct chats
  const getOtherParticipants = (room: ChatRoom) => {
    if (room.type === 'direct') {
      return room.participants.filter((p) => p.id !== userId);
    }
    return [];
  };

  // Get room display name
  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'direct') {
      const others = getOtherParticipants(room);
      if (others.length > 0) {
        return others.map((p) => p.fullName).join(', ');
      }
    }
    return room.name || 'Unnamed Chat';
  };

  if (loading) return <div>Loading chats...</div>;
  if (error) return <div>Error: {error}</div>;
  if (rooms.length === 0) return <div>No chat rooms found</div>;

  return (
    <div className="chat-list-container">
      <h2>Your Chats</h2>
      <div className="chat-rooms">
        {rooms.map((room) => {
          const displayName = getRoomDisplayName(room);
          const lastMessage = room.lastMessagePreview || 'No messages yet';
          const lastMessageTime = room.lastMessageTimestamp
            ? room.lastMessageTimestamp.toLocaleString()
            : '';

          return (
            <div
              key={room.id}
              className="chat-room-item"
              onClick={() => onSelectRoom(room.id)}
            >
              <div className="chat-room-avatar">
                {room.type === 'direct' &&
                getOtherParticipants(room)[0]?.avatarUrl ? (
                  <img
                    src={getOtherParticipants(room)[0].avatarUrl}
                    alt={displayName}
                    className="avatar"
                  />
                ) : (
                  <div className="group-avatar">{displayName.charAt(0)}</div>
                )}
              </div>
              <div className="chat-room-info">
                <div className="chat-room-header">
                  <h3>{displayName}</h3>
                  {lastMessageTime && (
                    <span className="timestamp">{lastMessageTime}</span>
                  )}
                </div>
                <p className="message-preview">{lastMessage}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
