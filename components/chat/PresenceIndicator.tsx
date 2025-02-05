import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';

interface PresenceIndicatorProps {
  userId: string;
  onPresenceChange?: (isNearby: boolean) => void;
}

export function PresenceIndicator({ userId, onPresenceChange }: PresenceIndicatorProps) {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const [isNearby, setIsNearby] = useState(false);

  useEffect(() => {
    if (!location || !userId) return;

    const channel = supabase.channel(`presence:${userId}`);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userPresence = state[userId]?.[0];
        
        if (userPresence && userPresence.location) {
          const distance = calculateDistance(
            location,
            userPresence.location
          );
          const nearby = distance <= 5000; // 5km radius
          setIsNearby(nearby);
          onPresenceChange?.(nearby);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, location, onPresenceChange, supabase]);

  return (
    <div className={`h-3 w-3 rounded-full ${isNearby ? 'bg-green-500' : 'bg-gray-400'}`} />
  );
}

function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
