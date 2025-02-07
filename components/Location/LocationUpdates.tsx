import { useEffect, useCallback } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useMap } from '@/components/contexts/MapContext';
import { LocationData } from '@/types';

interface PresenceUpdate {
  userId: string;
  location: LocationData;
  status: 'online' | 'away' | 'offline';
}

export default function LocationUpdates({
  onLocationUpdate
}: {
  onLocationUpdate: (location: LocationData) => void;
}) {
  const { setLocation } = useLocation();
  const { map } = useMap();

  const onPresenceUpdate = useCallback(() => {
    // Existing implementation
  }, []);

  useEffect(() => {
    // Listen for location updates from GeolocateControl
    if (map) {
      const onGeolocate = (e: any) => {
        if (e.coords) {
          const location: LocationData = {
            latitude: e.coords.latitude,
            longitude: e.coords.longitude,
            accuracy: e.coords.accuracy,
            timestamp: e.timestamp
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
