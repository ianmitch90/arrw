import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useLocation } from '@/contexts/LocationContext';

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

export function PresenceManager() {
  const [presenceStates, setPresenceStates] = useState<
    Map<string, PresenceState>
  >(new Map());
  const { state: locationState } = useLocation();
  const channel = supabase.channel('presence_updates');

  useEffect(() => {
    const setupPresence = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          updatePresenceStates(state);
        })
        .on('presence', { event: 'join' }, ({ key, joins }) => {
          // joins contains an array of presence states that joined
          if (joins && joins.length > 0) {
            handlePresenceJoin(key, joins[0]);
          }
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          handlePresenceLeave(key);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              user_id: user.id,
              status: 'online',
              last_seen: new Date().toISOString(),
              location: locationState.currentLocation,
              online_at: new Date().toISOString()
            });
          }
        });

      // Set up automatic away status
      setupAutoAway();

      // Update presence when location changes
      if (locationState.currentLocation) {
        await channel.track({
          location: locationState.currentLocation
        });
      }
    };

    setupPresence();

    return () => {
      channel.unsubscribe();
    };
  }, [locationState.currentLocation]);

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

  const setupAutoAway = () => {
    let inactivityTimeout: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(
        async () => {
          await channel.track({ status: 'away' });
        },
        5 * 60 * 1000
      ); // 5 minutes
    };

    window.addEventListener('mousemove', resetTimeout);
    window.addEventListener('keypress', resetTimeout);

    resetTimeout();

    return () => {
      clearTimeout(inactivityTimeout);
      window.removeEventListener('mousemove', resetTimeout);
      window.removeEventListener('keypress', resetTimeout);
    };
  };

  return null; // This is a manager component, no UI needed
}
