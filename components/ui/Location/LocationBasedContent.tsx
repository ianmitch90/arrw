import { useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';
import { ImmersiveVideoPlayer } from './ImmersiveVideoPlayer';
import { Database } from '@/types_db';

type VideoContent = {
  id: string;
  title: string;
  description: string;
  url: string;
  type: '360' | '180' | 'standard';
  location: Database['public']['Tables']['location_history']['Row']['location'];
  distance?: number;
};

// Helper function to convert PostGIS point to coordinates
const toCoordinates = (location: any) => {
  if (!location) return { latitude: 0, longitude: 0 };
  // PostGIS returns point in format: POINT(longitude latitude)
  const match = location.toString().match(/POINT\(([-\d.]+) ([-\d.]+)\)/);
  if (!match) return { latitude: 0, longitude: 0 };
  return {
    latitude: parseFloat(match[2]),
    longitude: parseFloat(match[1])
  };
};

export function LocationBasedContent() {
  const { state: locationState } = useLocation();
  const [nearbyContent, setNearbyContent] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (locationState.currentLocation) {
      loadNearbyContent();
    }
  }, [locationState.currentLocation]);

  const loadNearbyContent = async () => {
    try {
      if (!locationState.currentLocation) return;

      const coords = toCoordinates(locationState.currentLocation);
      const { data, error } = await supabase.rpc('find_nearby_content', {
        user_location: locationState.currentLocation,
        radius_miles: 50
      });

      if (error) throw error;

      // Transform the response data to include PostGIS points
      const contentWithDistance = data?.map((item: any) => ({
        ...item,
        location: item.location,
        distance: item.distance // distance is calculated by the PostGIS function
      })) || [];

      setNearbyContent(contentWithDistance);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to load content')
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading nearby content...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Nearby Content</h2>
      {nearbyContent.length === 0 ? (
        <p>No content found in your area</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nearbyContent.map((content) => {
            const coords = toCoordinates(content.location);
            return (
              <div
                key={content.id}
                className="rounded-lg overflow-hidden shadow-lg"
              >
                <ImmersiveVideoPlayer
                  src={content.url}
                  type={content.type}
                  enableAR={content.type !== 'standard'}
                />
                <div className="p-4">
                  <h3 className="font-bold">{content.title}</h3>
                  <p className="text-sm text-gray-600">{content.description}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    {content.distance && (
                      <p>{content.distance.toFixed(1)} miles away</p>
                    )}
                    <p className="font-mono">
                      ({coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)})
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
