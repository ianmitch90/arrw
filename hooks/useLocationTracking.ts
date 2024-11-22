import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';

export function useLocationTracking(options = { enableHighAccuracy: true }) {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);

  useEffect(() => {
    if (!user) return;

    let watchId: number;

    async function updateLocation(position: GeolocationPosition) {
      const { latitude, longitude, accuracy } = position.coords;
      
      setLocation({ latitude, longitude, accuracy });

      try {
        // Update user's location in the database
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            current_location: `POINT(${longitude} ${latitude})`,
            location_accuracy: accuracy,
            last_location_update: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating location:', updateError);
          setError('Failed to update location');
        }

        // Broadcast location update through presence
        const presenceChannel = supabase.channel('presence');
        await presenceChannel.track({
          user_id: user.id,
          location: { latitude, longitude },
          timestamp: new Date().toISOString(),
        });

      } catch (err) {
        console.error('Error in location update:', err);
        setError('Failed to process location update');
      }
    }

    function handleError(error: GeolocationPositionError) {
      console.error('Geolocation error:', error);
      setError(error.message);
    }

    // Start watching location
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        updateLocation,
        handleError,
        {
          enableHighAccuracy: options.enableHighAccuracy,
          maximumAge: 30000, // 30 seconds
          timeout: 27000, // 27 seconds
        }
      );
    } else {
      setError('Geolocation is not supported by this browser');
    }

    // Cleanup
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [user, supabase, options.enableHighAccuracy]);

  return { location, error };
}
