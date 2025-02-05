import { useState, useEffect, useCallback } from 'react';
import { useMap } from '@/components/contexts/MapContext';
import { LngLat } from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseUserLocationReturn {
  location: Coordinates | null;
  error: string | null;
  requestLocation: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { map } = useMap();

  const requestLocation = useCallback(() => {
    if (!map) {
      setError('Map not initialized');
      return;
    }

    // Trigger the GeolocateControl
    const geolocateControl = map.getControls().find(control => 
      control instanceof mapboxgl.GeolocateControl
    ) as mapboxgl.GeolocateControl;

    if (geolocateControl) {
      geolocateControl.trigger();
    } else {
      setError('Geolocation control not found');
    }
  }, [map]);

  useEffect(() => {
    if (!map) return;

    const handleGeolocate = (event: mapboxgl.GeolocateEvent) => {
      const newLocation = new LngLat(event.coords.longitude, event.coords.latitude);
      const coordinates = {
        latitude: newLocation.lat,
        longitude: newLocation.lng
      };

      setLocation(coordinates);
    };

    map.on('geolocate', handleGeolocate);

    return () => {
      map.off('geolocate', handleGeolocate);
    };
  }, [map]);

  return {
    location,
    error,
    requestLocation
  };
}
