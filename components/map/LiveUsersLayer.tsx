import { useLocationTracking } from '@/hooks/useLocationTracking';
import { getDistance } from 'geolib';
import { LiveUsersLayerProps } from '@/types/map';
import { UserMarker } from './markers/UserMarker';

export function LiveUsersLayer({ users, currentUser }: LiveUsersLayerProps) {
  const { location } = useLocationTracking();
  
  if (!location || !users) return null;

  return (
    <>
      {users.map((otherUser) => {
        if (
          otherUser.id === currentUser?.id || 
          !otherUser.current_location ||
          !otherUser.current_location.coordinates
        ) return null;

        // Convert PostGIS point to lat/lng
        const [longitude, latitude] = otherUser.current_location.coordinates;
        const userLocation = { latitude, longitude };

        const distance = getDistance(
          { latitude: location.latitude, longitude: location.longitude },
          userLocation
        ) / 1609.34; // Convert meters to miles

        // Transform the user data to match UserMarker props
        const transformedUser = {
          id: otherUser.id,
          presence_status: otherUser.presence_status,
          last_seen_at: otherUser.last_seen_at || new Date().toISOString(),
          current_location: userLocation,
          location_accuracy: otherUser.location_accuracy,
          location_sharing: otherUser.location_sharing,
          avatar_url: otherUser.avatar_url,
          full_name: otherUser.full_name
        };

        return (
          <UserMarker
            key={otherUser.id}
            user={transformedUser}
            distance={distance}
          />
        );
      })}
    </>
  );
}
