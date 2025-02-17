import { useState, useEffect, useCallback } from 'react';
import { useMap } from '@/components/contexts/MapContext';
import { LngLat, Map } from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';
import { Coordinates } from '@/types/map';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';

interface UseUserLocationReturn {
  location: Coordinates | null;
  error: string | null;
  requestLocation: () => void;
}

// Define the GeolocateEvent type since it's not exported from mapbox-gl
interface GeolocateResultEvent {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  timestamp: number;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { map } = useMap();
  const supabase = useSupabaseClient<Database>();

  const updateLocationInDatabase = useCallback(async (coords: Coordinates) => {
    const { error: updateError } = await supabase.rpc('update_profile_location', {
      lat: coords.latitude,
      lon: coords.longitude
    });

    if (updateError) {
      console.error('Error updating location:', updateError);
      toast({
        title: 'Error updating location',
        description: 'Failed to update your location in the database',
        variant: 'destructive'
      });
    }
  }, [supabase]);

  const handleGeolocate = useCallback((event: GeolocateResultEvent) => {
    const newLocation = new LngLat(event.coords.longitude, event.coords.latitude);
    const coordinates = {
      latitude: newLocation.lat,
      longitude: newLocation.lng
    };

    setLocation(coordinates);
    updateLocationInDatabase(coordinates);
  }, [updateLocationInDatabase]);

const requestLocation = useCallback(() => {
  if (!map) {
    setError('Map not initialized');
    return;
  }

  // Use the browser's geolocation API directly
  navigator.geolocation.getCurrentPosition(
    (position) => {
      handleGeolocate({
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        },
        timestamp: position.timestamp
      });
    },
    (positionError) => {
      setError(positionError.message);
      toast({
        title: 'Location Error',
        description: positionError.message,
        variant: 'destructive'
      });
    }
  );
}, [map, handleGeolocate]);

  useEffect(() => {
    if (!map) return;

    // Add event listener for geolocate events
    map.on('geolocate', handleGeolocate as any);

    return () => {
      map.off('geolocate', handleGeolocate as any);
    };
  }, [map, handleGeolocate]);

  return {
    location,
    error,
    requestLocation
  };
}