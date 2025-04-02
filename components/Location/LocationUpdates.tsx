import { useEffect, useCallback } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useMap } from '@/components/contexts/MapContext';
import { LocationData } from '@/types';
import { PostGISPoint } from '@/types/index';
import { createClient } from '@/utils/supabase/client';

interface PresenceUpdate {
  userId: string;
  location: PostGISPoint;
  status: 'online' | 'away' | 'offline';
}

export default function LocationUpdates({
  onLocationUpdate
}: {
  onLocationUpdate: (location: LocationData) => void;
}) {
  const { setLocation } = useLocation();
  const { map } = useMap();

  const supabase = createClient();

  const onPresenceUpdate = useCallback(async (update: PresenceUpdate) => {
    if (update.location) {
      const { error } = await supabase.rpc('update_profile_location', {
        profile_id: update.userId,
        lat: update.location.coordinates[1],
        lon: update.location.coordinates[0]
      });
      if (error) {
        console.error('Error updating location:', error);
      }
    }
  }, [supabase]);

  useEffect(() => {
    // Listen for location updates from GeolocateControl
    if (map) {
      const onGeolocate = (e: any) => {
        if (e.coords) {
          const location: PostGISPoint = {
            type: 'Point',
            coordinates: [e.coords.longitude, e.coords.latitude],
            crs: {
              type: 'name',
              properties: {
                name: 'EPSG:4326'
              }
            }
          };
          onLocationUpdate(location);
          setLocation(location);
        }
      };

      map.on('geolocate', onGeolocate);

      return () => {
        map.off('geolocate', onGeolocate);
      };
    }
  }, [map, setLocation, onLocationUpdate]);

  return null;
}
