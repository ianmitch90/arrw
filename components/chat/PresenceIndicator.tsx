import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

interface UserPresence {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

export function PresenceIndicator({ userId }: { userId: string }) {
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const { state: locationState } = useLocation();

  useEffect(() => {
    const channel = supabase.channel('presence');

    // Subscribe to presence updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userState = state[userId];
        if (userState) {
          setPresence(userState[0] as UserPresence);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId,
            status: 'online',
            lastSeen: new Date(),
            location: locationState.currentLocation
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [userId, locationState.currentLocation]);

  if (!presence) return null;

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-2 h-2 rounded-full ${
          presence.status === 'online'
            ? 'bg-green-500'
            : presence.status === 'away'
              ? 'bg-yellow-500'
              : 'bg-gray-500'
        }`}
      />
      <span className="text-sm text-gray-600">
        {presence.status === 'online'
          ? 'Online'
          : `Last seen ${new Date(presence.lastSeen).toLocaleString()}`}
      </span>
    </div>
  );
}
