import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useLocation } from '@/contexts/LocationContext';
import { LocationPrivacyManager } from '@/utils/location-privacy';

interface LocationUpdate {
  userId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  accuracy?: number;
}

export function LocationUpdates() {
  const [updates, setUpdates] = useState<LocationUpdate[]>([]);
  const { state: locationState } = useLocation();
  const [watchId, setWatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!locationState.currentLocation) return;

    // Subscribe to nearby location updates
    const channel = supabase.channel('location_updates');

    channel
      .on('broadcast', { event: 'location_update' }, (payload) => {
        const update = payload.payload as LocationUpdate;
        setUpdates((current) => {
          const filtered = current.filter((u) => u.userId !== update.userId);
          return [...filtered, update].sort(
            (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
          );
        });
      })
      .subscribe();

    // Start watching position if privacy settings allow
    if (
      LocationPrivacyManager.shouldTrackLocation(locationState.privacySettings)
    ) {
      const id = navigator.geolocation.watchPosition(
        async (position) => {
          const update: LocationUpdate = {
            userId: (await supabase.auth.getUser()).data.user!.id,
            location: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            timestamp: new Date(),
            accuracy: position.coords.accuracy
          };

          await channel.send({
            type: 'broadcast',
            event: 'location_update',
            payload: update
          });
        },
        (error) => console.error('Location watch error:', error),
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 27000
        }
      );

      setWatchId(id);
    }

    return () => {
      channel.unsubscribe();
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [locationState.currentLocation, locationState.privacySettings]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Nearby Updates</h3>
      {updates.map((update) => (
        <div
          key={`${update.userId}-${update.timestamp.getTime()}`}
          className="p-2 border rounded"
        >
          <p>User: {update.userId}</p>
          <p>
            Distance:{' '}
            {calculateDistance(locationState.currentLocation!, update.location)}
            mi
          </p>
          <p>Updated: {new Date(update.timestamp).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
}

function calculateDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  // Haversine formula implementation
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  const lat1 = toRad(point1.latitude);
  const lat2 = toRad(point2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
