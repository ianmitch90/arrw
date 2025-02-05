import { getDistance } from 'geolib';
import { LiveUsersLayerProps } from '@/types/map';
import { UserMarker } from './markers/UserMarker';
import { useLocation } from '@/contexts/LocationContext';
import { useEffect, useState } from 'react';
import { useMap } from '@/components/contexts/MapContext';

export function LiveUsersLayer({ users, currentUser }: LiveUsersLayerProps) {
  const { location } = useLocation();
  const { map } = useMap();
  const [userDistances, setUserDistances] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!location || !users) return;

    // Calculate distances for each user
    const distances = users.reduce((acc, otherUser) => {
      if (
        otherUser.id === currentUser?.id || 
        !otherUser.current_location ||
        !otherUser.current_location.coordinates
      ) return acc;

      // Convert PostGIS point to lat/lng
      const [longitude, latitude] = otherUser.current_location.coordinates;
      const userLocation = { latitude, longitude };

      const distance = getDistance(
        { latitude: location.latitude, longitude: location.longitude },
        userLocation
      ) / 1609.34; // Convert meters to miles

      return { ...acc, [otherUser.id]: distance };
    }, {});

    setUserDistances(distances);
  }, [location, users, currentUser]);

  if (!location || !map) return null;

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

        const distance = userDistances[otherUser.id];

        // Transform the user data to match UserMarker props
        const transformedUser = {
          id: otherUser.id,
          presence_status: otherUser.presence_status,
          last_seen_at: otherUser.last_seen_at || new Date().toISOString(),
          current_location: {
            latitude: Number(latitude),
            longitude: Number(longitude)
          },
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
            onClick={() => {}}
          />
        );
      })}
    </>
  );
}
