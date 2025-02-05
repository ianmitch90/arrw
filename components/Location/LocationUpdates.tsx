import { useEffect } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useMap } from '@/components/contexts/MapContext';

export default function LocationUpdates() {
  const { setLocation, setError } = useLocation();
  const { map } = useMap();

  useEffect(() => {
    // Listen for location updates from GeolocateControl
    if (map) {
      const onGeolocate = (e: any) => {
        if (e.coords) {
          setLocation({
            latitude: e.coords.latitude,
            longitude: e.coords.longitude
          });
        }
      };

      map.on('geolocate', onGeolocate);

      return () => {
        map.off('geolocate', onGeolocate);
      };
    }
  }, [map, setLocation]);

  return null;
}
