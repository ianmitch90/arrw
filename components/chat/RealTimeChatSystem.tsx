import { useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { RealtimeMessaging } from '@/utils/realtime/messaging';
import { LocationTrackingSystem } from '@/utils/realtime/location-tracking';
import { supabase } from '@/utils/supabase/client';

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  attachments?: {
    type: 'location' | 'image' | 'video';
    data: any;
  }[];
  timestamp: Date;
}

export function RealTimeChatSystem() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const { state: locationState } = useLocation();
  const { state: subscriptionState } = useSubscription();
  const messaging = new RealtimeMessaging();
  const locationTracking = new LocationTrackingSystem();

  useEffect(() => {
    const setupRealTime = async () => {
      // Initialize location tracking
      await locationTracking.initialize();

      // Join location-based chat room
      if (locationState.currentLocation) {
        const roomId = `location-${Math.floor(locationState.currentLocation.latitude)}-${Math.floor(locationState.currentLocation.longitude)}`;
        await messaging.joinRoom(roomId, (message) => {
          if ('sender' in message && 'timestamp' in message && 'id' in message.sender && 'name' in message.sender && 'location' in message.sender && 'latitude' in message.sender.location && 'longitude' in message.sender.location) {
            setMessages((prev) => [...prev, message]);
          }
        });

        // Start tracking nearby users
        await trackNearbyUsers();
      }
    };

    setupRealTime();

    return () => {
      locationTracking.stop();
      messaging.dispose();
    };
  }, [locationState.currentLocation]);

  const trackNearbyUsers = async () => {
    if (!locationState.currentLocation) return;

    const { data: users } = await supabase.rpc('get_nearby_users', {
      latitude: locationState.currentLocation.latitude,
      longitude: locationState.currentLocation.longitude,
      radius_miles: subscriptionState.tier === 'premium' ? 50 : 25
    });

    setNearbyUsers(users || []);
  };

  const sendMessage = async (content: string, attachments?: any[]) => {
    if (!locationState.currentLocation) return;

    const roomId = `location-${Math.floor(locationState.currentLocation.latitude)}-${Math.floor(locationState.currentLocation.longitude)}`;

    await messaging.sendMessage(roomId, content, attachments);
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
        {message.attachments?.map((attachment, index) => (
          <AttachmentPreview key={index} attachment={attachment} />
        ))}
      </div>
    </div>
  );
}

function ChatInput({
  onSend
}: {
  onSend: (content: string, attachments?: any[]) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const { state: locationState } = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await onSend(content, attachments);
    setContent('');
    setAttachments([]);
  };

  const attachLocation = () => {
    if (locationState.currentLocation) {
      setAttachments((prev) => [
        ...prev,
        {
          type: 'location',
          data: locationState.currentLocation
        }
      ]);
    }
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
        type="button"
        onClick={attachLocation}
        className="p-2 text-blue-500 hover:text-blue-600"
      >
        📍
      </button>
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

function AttachmentPreview({ attachment }: { attachment: any }) {
  if (attachment.type === 'location') {
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded-lg">
        📍 Location: {attachment.data.latitude.toFixed(6)},{' '}
        {attachment.data.longitude.toFixed(6)}
      </div>
    );
  }
  return null;
}
