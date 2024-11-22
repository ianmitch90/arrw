import { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { UserMarker } from './markers/UserMarker';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { getDistance } from 'geolib';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserPresence = {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  profile: Profile;
};

export function LiveUsersLayer() {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const { location, error: locationError } = useLocationTracking();
  const [users, setUsers] = useState<UserPresence[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Subscribe to presence updates
    const channel = supabase.channel('live_users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Transform presence state into user array
        const userArray = Object.entries(state).map(([userId, presenceArray]) => {
          const presence = presenceArray[0] as any;
          return {
            id: userId,
            location: presence.location,
            status: presence.status || 'offline',
            lastSeen: new Date(presence.timestamp),
            profile: presence.profile,
          };
        });

        setUsers(userArray);
      })
      .on('presence', { event: 'join' }, ({ key, newPresence }) => {
        console.log('User joined:', key, newPresence);
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        console.log('User left:', key);
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') {
          setError('Failed to subscribe to presence updates');
          return;
        }

        // Track current user's presence
        if (location) {
          await channel.track({
            user_id: user.id,
            location,
            status: 'online',
            timestamp: new Date().toISOString(),
            profile: {
              // Add relevant profile data
              avatar_url: user.user_metadata.avatar_url,
              full_name: user.user_metadata.full_name,
            },
          });
        }
      });

    // Fetch initial user locations
    const fetchUsers = async () => {
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .not('current_location', 'is', null);

      if (fetchError) {
        console.error('Error fetching users:', fetchError);
        setError('Failed to fetch users');
        return;
      }

      const userPresence = profiles.map(profile => ({
        id: profile.id,
        location: {
          latitude: parseFloat(profile.current_location!.split(' ')[1]),
          longitude: parseFloat(profile.current_location!.split(' ')[0]),
        },
        status: profile.status as 'online' | 'away' | 'offline',
        lastSeen: new Date(profile.last_seen || ''),
        profile,
      }));

      setUsers(userPresence);
    };

    fetchUsers();

    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, [user, supabase, location]);

  if (error || locationError) {
    console.error('LiveUsersLayer error:', error || locationError);
    // You might want to show an error UI component here
    return null;
  }

  return (
    <>
      {users.map((userPresence) => {
        if (!location || !userPresence.location) return null;

        // Calculate distance between current user and this user
        const distance = getDistance(
          { latitude: location.latitude, longitude: location.longitude },
          { latitude: userPresence.location.latitude, longitude: userPresence.location.longitude }
        ) / 1609.34; // Convert meters to miles

        return (
          <UserMarker
            key={userPresence.id}
            user={userPresence}
            distance={distance}
            longitude={userPresence.location.longitude}
            latitude={userPresence.location.latitude}
            onClick={() => {
              // Handle click - maybe open user profile or start chat
              console.log('Clicked user:', userPresence);
            }}
          />
        );
      })}
    </>
  );
}
