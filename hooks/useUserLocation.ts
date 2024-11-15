import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { LngLat } from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';

const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds
const MINIMUM_DISTANCE_CHANGE = 10; // 10 meters
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

export function useUserLocation() {
  const [location, setLocation] = useState<LngLat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLocation = useRef<LngLat | null>(null);
  const supabase = createClientComponentClient<Database>();
  const watchId = useRef<number | null>(null);

  const calculateDistance = (loc1: LngLat, loc2: LngLat): number => {
    // Haversine formula for distance calculation
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (loc1.lat * Math.PI) / 180;
    const φ2 = (loc2.lat * Math.PI) / 180;
    const Δφ = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const Δλ = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const updateLocationWithRetry = async (
    newLocation: LngLat,
    retryCount = 0
  ) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${newLocation.lng} ${newLocation.lat})`,
          location_updated_at: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;
      lastLocation.current = newLocation;
    } catch (err) {
      console.error('Error updating location:', err);

      if (retryCount < MAX_RETRIES) {
        toast({
          description: 'Retrying location update...',
          variant: 'info'
        });

        setTimeout(
          () => {
            updateLocationWithRetry(newLocation, retryCount + 1);
          },
          RETRY_DELAY * Math.pow(2, retryCount)
        );
      } else {
        setError(
          err instanceof Error ? err.message : 'Error updating location'
        );
        toast({
          description: 'Failed to update location',
          variant: 'error',
          action: {
            label: 'Retry',
            onClick: () => updateLocationWithRetry(newLocation, 0)
          }
        });
      }
    }
  };

  useEffect(() => {
    let lastUpdateTime = 0;

    const handlePositionUpdate = async (position: GeolocationPosition) => {
      const newLocation = new LngLat(
        position.coords.longitude,
        position.coords.latitude
      );

      setLocation(newLocation);

      const now = Date.now();
      const shouldUpdate =
        !lastLocation.current ||
        now - lastUpdateTime > LOCATION_UPDATE_INTERVAL ||
        (lastLocation.current &&
          calculateDistance(lastLocation.current, newLocation) >
            MINIMUM_DISTANCE_CHANGE);

      if (shouldUpdate) {
        await updateLocationWithRetry(newLocation);
        lastUpdateTime = now;
      }
    };

    // Start watching position with high accuracy
    watchId.current = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (err) => setError(err.message),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return { location, error };
}
