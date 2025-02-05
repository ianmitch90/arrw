import { useEffect, useRef, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';

interface PresenceState {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  activity?: {
    type: string;
    metadata?: any;
  };
}

interface PresenceManagerProps {
  userId: string;
}

export function PresenceManager({ userId }: PresenceManagerProps) {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const presenceChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [presenceStates, setPresenceStates] = useState<Map<string, PresenceState>>(new Map());

  useEffect(() => {
    if (!location || !userId) return;

    // Create or update presence channel
    presenceChannel.current = supabase.channel(`presence:${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Track user's presence with location
    presenceChannel.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.current?.presenceState();
        updatePresenceStates(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        handlePresenceJoin(key, newPresences[0]);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        handlePresenceLeave(key);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.current?.track({
            user_id: userId,
            location: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      presenceChannel.current?.unsubscribe();
    };
  }, [userId, location, supabase]);

  const updatePresenceStates = (state: any) => {
    const newStates = new Map<string, PresenceState>();
    Object.entries(state).forEach(([key, value]: [string, any]) => {
      newStates.set(key, {
        userId: value.user_id,
        status: value.status,
        lastSeen: new Date(value.last_seen),
        location: value.location,
        activity: value.activity
      });
    });
    setPresenceStates(newStates);
  };

  const handlePresenceJoin = (key: string, presence: any) => {
    setPresenceStates((prev) => {
      const next = new Map(prev);
      next.set(key, {
        userId: presence.user_id,
        status: presence.status,
        lastSeen: new Date(presence.last_seen),
        location: presence.location,
        activity: presence.activity
      });
      return next;
    });
  };

  const handlePresenceLeave = (key: string) => {
    setPresenceStates((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (state) {
        next.set(key, { ...state, status: 'offline' });
      }
      return next;
    });
  };

  return null; // This is a manager component, no UI needed
}
