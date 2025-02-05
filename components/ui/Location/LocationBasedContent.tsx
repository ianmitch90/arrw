import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';
import { ImmersiveVideoPlayer } from './ImmersiveVideoPlayer';

interface LocationBasedContentProps {
  radius?: number; // in meters
  children: React.ReactNode;
}

interface NearbyContent {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
}

export function LocationBasedContent({ radius = 1000, children }: LocationBasedContentProps) {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();
  const [nearbyContent, setNearbyContent] = useState<NearbyContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!location) return;

    const fetchNearbyContent = async () => {
      try {
        const { data, error } = await supabase.rpc('find_nearby_content', {
          user_location: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          radius_meters: radius
        });

        if (error) throw error;

        // Transform the response data to include PostGIS points
        const contentWithDistance = data?.map((item: any) => ({
          ...item,
          location: {
            latitude: item.location.latitude,
            longitude: item.location.longitude
          },
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

    fetchNearbyContent();
  }, [location, radius, supabase]);

  if (loading) return <div>Loading nearby content...</div>;
  if (error) return <div>Error: {error.message}</div>;

  if (!location) {
    return (
      <div className="p-4 text-center">
        <p>Waiting for location...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold">Your Location</h3>
        <p className="text-sm text-gray-600">
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </p>
      </div>

      <div className="space-y-4">
        {nearbyContent.length === 0 ? (
          <p>No content found in your area</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {nearbyContent.map((content) => (
              <div key={content.id} className="rounded-lg overflow-hidden shadow-lg">
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
                      <p>{content.distance.toFixed(1)} meters away</p>
                    )}
                    <p className="font-mono">
                      ({content.location.latitude.toFixed(6)}, {content.location.longitude.toFixed(6)})
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
