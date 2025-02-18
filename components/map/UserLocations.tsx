import { useEffect, useState } from 'react';
import { Marker } from 'react-map-gl';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import { UserAvatar } from "@/components/ui/UserAvatar/UserAvatar";

type ProfilesTable = Database['public']['Tables']['profiles']['Row'];
type LocationType = { coordinates: [number, number] };

type MapProfile = Pick<ProfilesTable, 
  | 'id' 
  | 'full_name' 
  | 'avatar_url' 
  | 'last_location_update'
  | 'age_verification_method'
  | 'age_verified'
  | 'age_verified_at'
  | 'bio'
  | 'birth_date'
  | 'created_at'
  | 'updated_at'
> & {
  current_location: LocationType;
};

export const UserLocations = () => {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [nearbyUsers, setNearbyUsers] = useState<MapProfile[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchNearbyUsers = async () => {
const { data, error } = await supabase
  .from('profiles')
  .select(`
    id,
    full_name,
    avatar_url,
    current_location,
    last_location_update
  `)
  .neq('id', user.id)
  .not('current_location', 'is', null)
  .gte('last_location_update', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('Error fetching nearby users:', error);
        return;
      }

      setNearbyUsers((data || []) as MapProfile[]);
    };

    fetchNearbyUsers();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:profiles')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=neq.${user.id}`
        },
        (payload) => {
          const updatedProfile = payload.new as MapProfile;
          
          if (!updatedProfile.current_location?.coordinates) return;

          setNearbyUsers(current =>
            current.some(u => u.id === updatedProfile.id)
              ? current.map(u => u.id === updatedProfile.id ? updatedProfile : u)
              : [...current, updatedProfile]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user]);

  return (
    <>
      {nearbyUsers.map((profile) => {
        if (!profile.current_location?.coordinates) return null;
        
        const [longitude, latitude] = profile.current_location.coordinates;
        
        return (
          <Marker
            key={profile.id}
            longitude={longitude}
            latitude={latitude}
          >
            <UserAvatar 
              userId={profile.id}
              size="sm"
              showPresence={false}
              className="border-2 border-white shadow-md"
            />
          </Marker>
        );
      })}
    </>
  );
};