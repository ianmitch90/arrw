import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
  };
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

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

export function RealTimeChatSystem() {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!location) return;

    // Subscribe to nearby chat messages
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
          setMessages((prev) => [
            ...prev,
            {
              id: message.id,
              content: message.content,
              sender: {
                id: message.sender_id,
                name: '', // Assuming name is not provided in the new structure
              },
              location: message.location,
              timestamp: new Date(message.sent_at),
            } as ChatMessage,
          ]);
        }
      })
      .subscribe();

    setChannel(chatChannel);

    return () => {
      chatChannel.unsubscribe();
    };
  }, [location, supabase]);

  const trackNearbyUsers = async () => {
    if (!location) return;

    const { data: users } = await supabase.rpc('get_nearby_users', {
      latitude: location.latitude,
      longitude: location.longitude,
      radius_miles: 25, // Assuming radius is not provided in the new structure
    });

    setNearbyUsers(users || []);
  };

  const sendMessage = async (content: string) => {
    if (!location || !channel) return;

    const message: Message = {
      id: crypto.randomUUID(),
      content,
      sender_id: (await supabase.auth.getUser()).data.user!.id,
      sent_at: new Date().toISOString(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
    };

    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <div className="p-4 border-t">
        <ChatInput onSend={sendMessage} />
      </div>
      <div className="border-l w-64 p-4">
        <NearbyUsers users={nearbyUsers} />
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="font-semibold">{message.sender.name}</span>
          <span className="text-sm text-gray-500">
            {message.timestamp.toLocaleTimeString()}
          </span>
        </div>
        <p className="mt-1">{message.content}</p>
      </div>
    </div>
  );
}

function ChatInput({
  onSend
}: {
  onSend: (content: string) => Promise<void>;
}) {
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
        className="flex-1 rounded-lg border p-2"
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

function NearbyUsers({ users }: { users: any[] }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold mb-4">Nearby Users</h3>
      {users.map((user) => (
        <div key={user.id} className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>{user.name}</span>
          <span className="text-sm text-gray-500">
            {user.distance.toFixed(1)} mi
          </span>
        </div>
      ))}
    </div>
  );
}
