import { useEffect, useState } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';
import { ImmersiveVideoPlayer } from './ImmersiveVideoPlayer';

interface VideoContent {
  id: string;
  title: string;
  description: string;
  url: string;
  type: '360' | '180' | 'standard';
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

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

      const { data, error } = await supabase.rpc('find_nearby_content', {
        lat: locationState.currentLocation.latitude,
        lng: locationState.currentLocation.longitude,
        radius_miles: 50
      });

      if (error) throw error;

      setNearbyContent(data || []);
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
          {nearbyContent.map((content) => (
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
                {content.distance && (
                  <p className="text-sm text-gray-500">
                    {content.distance.toFixed(1)} miles away
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
