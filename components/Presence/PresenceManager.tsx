import { useEffect, useRef, useState, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';
import { PresenceState } from '@/types';

interface PresenceManagerProps {
  children: React.ReactNode;
  onPresenceUpdate: (presence: PresenceState) => void;
  userId: string;
}

export const PresenceManager: React.FC<PresenceManagerProps> = ({ children, onPresenceUpdate, userId }) => {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const presenceChannel = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [presenceStates, setPresenceStates] = useState<PresenceState[]>([]);

  useEffect(() => {
    if (!location || !userId) return;

    presenceChannel.current = supabase.channel(`presence:${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

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
    const newStates: PresenceState[] = Object.entries(state).map(([key, value]: [string, any]) => ({
      userId: value.user_id,
      location: value.location,
      status: value.status,
      lastActive: new Date(value.last_seen),
      activity: value.activity,
      timestamp: new Date(value.last_seen).getTime()
    }));
    setPresenceStates(newStates);
  };

  const handlePresenceJoin = (key: string, presence: any) => {
    setPresenceStates((prev) => [...prev, {
      userId: presence.user_id,
      location: presence.location,
      status: presence.status,
      lastActive: new Date(presence.last_seen),
      activity: presence.activity,
      timestamp: new Date(presence.last_seen).getTime()
    }]);
  };

  const handlePresenceLeave = (key: string) => {
    setPresenceStates((prev) => prev.map((state) => state.userId === key ? { ...state, status: 'offline' } : state));
  };

  const handleUpdatePresence = useCallback((presence: PresenceState) => {
    onPresenceUpdate(presence);
  }, [onPresenceUpdate]);

  return null; 
}
