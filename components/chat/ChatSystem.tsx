import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sent_at: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export function ChatSystem() {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  // TODO: Implement room management in the future
  // const [rooms, setRooms] = useState<ChatRoom[]>([]);
  // const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    if (!location) return;

    const chatChannel = supabase.channel('nearby_chat', {
      config: {
        broadcast: {
          self: true
        }
      }
    });

    chatChannel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const message = payload as Message;
        if (isMessageNearby(message, location)) {
          setMessages(prev => [...prev, message]);
        }
      })
      .subscribe();

    setChannel(chatChannel);

    return () => {
      chatChannel.unsubscribe();
    };
  }, [location, supabase]);

  const sendMessage = async (content: string) => {
    if (!location || !channel) return;

    const message: Message = {
      id: crypto.randomUUID(),
      content,
      sender_id: (await supabase.auth.getUser()).data.user!.id,
      sent_at: new Date().toISOString(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude
      }
    };

    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message
    });
  };

  const isMessageNearby = (message: Message, userLocation: { latitude: number; longitude: number }) => {
    const MAX_DISTANCE = 5; // 5km radius
    const R = 6371; // Earth's radius in km

    const lat1 = userLocation.latitude * Math.PI / 180;
    const lat2 = message.location.latitude * Math.PI / 180;
    const deltaLat = (message.location.latitude - userLocation.latitude) * Math.PI / 180;
    const deltaLon = (message.location.longitude - userLocation.longitude) * Math.PI / 180;

    const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
             Math.cos(lat1) * Math.cos(lat2) *
             Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= MAX_DISTANCE;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
      <div className="border-t p-4">
        <MessageInput onSend={sendMessage} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-start space-x-2">
      <div className="flex-grow bg-white rounded-lg shadow p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">User {message.sender_id.slice(0, 8)}</span>
          <span className="text-xs text-gray-500">
            {new Date(message.sent_at).toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-1">{message.content}</p>
      </div>
    </div>
  );
}

function MessageInput({ onSend }: { onSend: (content: string) => Promise<void> }) {
  const [content, setContent] = useState('');
  const { location } = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !location) return;

    await onSend(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="flex-grow p-2 border rounded-lg"
        placeholder="Type a message..."
      />
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Send
      </button>
    </form>
  );
}
