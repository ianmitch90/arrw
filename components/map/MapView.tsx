 import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, GeolocateControl, MapRef } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import { Button } from '@nextui-org/react';
import { Filter, Plus } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { PlaceCard } from './PlaceCard';
import { StoryMarker } from './StoryMarker';
import { LiveUsersLayer } from './LiveUsersLayer';
import { PlaceMarker } from './PlaceMarker';
import { StoryViewer } from '../stories/StoryViewer';
import { PlaceCreator } from './PlaceCreator';
import { useMap } from '@/components/contexts/MapContext';
import { 
  Coordinates,
  Places,
  Stories,
  Profiles,
  MapFilters,
  PostGISPoint
} from '@/types/map';

interface MapViewProps {
  initialLocation?: Coordinates;
  onLocationChange?: (coords: Coordinates, isVisiting?: boolean) => void;
}

export default function MapView({ initialLocation, onLocationChange }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const watchIdRef = useRef<number | null>(null);
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const { currentLocation, setCurrentLocation, viewport, setViewport, setMap } = useMap();
  const [places, setPlaces] = useState<Places[]>([]);
  const [stories, setStories] = useState<Stories[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Places | null>(null);
  const [selectedStory, setSelectedStory] = useState<Stories | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [newPlaceLocation, setNewPlaceLocation] = useState<Coordinates | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<Profiles[]>([]);
  const [currentUser, setCurrentUser] = useState<Profiles | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    placeTypes: ['poi', 'event_venue'],
    radius: 10,
    showStories: true,
    showPlaces: true
  });

  useEffect(() => {
    if (initialLocation) {
      setViewport((prev: any) => ({
        ...prev,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        zoom: 15
      }));
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation, setViewport, setCurrentLocation]);

  // Fetch current user's profile
  useEffect(() => {
    if (!user) return;

    const fetchCurrentUser = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching current user profile:', error);
        return;
      }

      if (data) {
        const profile = data as Database['public']['Tables']['profiles']['Row'];
        setCurrentUser({
          ...profile,
          current_location: profile.current_location ? {
            type: 'Point',
            coordinates: (profile.current_location as any).coordinates
          } : undefined
        });
      }
    };

    fetchCurrentUser();
  }, [user, supabase]);

  // Update user location and fetch nearby users
  const updateUserLocation = useCallback(async (coords: Coordinates) => {
    if (!user) return;

    try {
      setCurrentLocation(coords);
      
      const point: PostGISPoint = {
        type: 'Point',
        coordinates: [coords.longitude, coords.latitude]
      };

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          current_location: point,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating location:', updateError);
        return;
      }

      if (updatedProfile) {
        const profile = updatedProfile as Database['public']['Tables']['profiles']['Row'];
        setCurrentUser({
          ...profile,
          current_location: profile.current_location ? {
            type: 'Point',
            coordinates: (profile.current_location as any).coordinates
          } : undefined
        });
      }

      onLocationChange?.(coords);

      const { data: nearbyData, error: nearbyError } = await supabase
        .rpc('find_users_within_radius', {
          user_lat: coords.latitude,
          user_lng: coords.longitude,
          radius_miles: filters.radius
        });

      if (nearbyError) {
        console.error('Error fetching nearby users:', nearbyError);
        return;
      }

      if (nearbyData) {
        setNearbyUsers(nearbyData.map((u: any) => ({
          ...u,
          current_location: u.current_location ? {
            type: 'Point',
            coordinates: u.current_location.coordinates
          } : undefined
        })));
      }
    } catch (err) {
      console.error('Error in updateUserLocation:', err);
    }
  }, [user, supabase, filters.radius, setCurrentLocation, onLocationChange]);

  // Handle position updates
  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    updateUserLocation(coords);
  }, [updateUserLocation]);

  // Start watching position
  useEffect(() => {
    if (navigator.geolocation && !watchIdRef.current) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => console.error('Error watching position:', error),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }

    return () => {
      if (navigator.geolocation && typeof navigator.geolocation.clearWatch === 'function' && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [handlePositionUpdate]);

  // Fetch places and stories
  useEffect(() => {
    if (!currentLocation) return;

    const fetchData = async () => {
      try {
        // Fetch nearby places
        const { data: placesData, error: placesError } = await supabase
          .rpc('find_places_within_radius', {
            user_lat: currentLocation.latitude,
            user_lng: currentLocation.longitude,
            radius_miles: filters.radius,
            place_types: filters.placeTypes
          });

        if (placesError) {
          console.error('Error fetching places:', placesError);
        } else {
          setPlaces(placesData || []);
        }

        // Fetch nearby stories
        if (filters.showStories) {
          const { data: storiesData, error: storiesError } = await supabase
            .rpc('find_stories_within_radius', {
              user_lat: currentLocation.latitude,
              user_lng: currentLocation.longitude,
              radius_miles: filters.radius
            });

          if (storiesError) {
            console.error('Error fetching stories:', storiesError);
          } else {
            // Transform stories data to include required fields
            const transformedStories = await Promise.all((storiesData || []).map(async (story) => {
              // Default user data
              let userData = { avatar_url: '', full_name: 'Anonymous' };

              // Only fetch user data if we have a creator ID
              if (story.created_by) {
                const { data: userResult } = await supabase
                  .from('profiles')
                  .select('avatar_url, full_name')
                  .eq('id', story.created_by)
                  .single();
                
                if (userResult) {
                  const profile = userResult as Database['public']['Tables']['profiles']['Row'];
                  userData = {
                    avatar_url: profile.avatar_url || '',
                    full_name: profile.full_name || 'Anonymous'
                  };
                }
              }

              return {
                ...story,
                user: userData,
                story_content: {
                  type: story.media_url ? 'image' : 'text',
                  url: story.media_url || story.content || '',
                  thumbnail_url: story.media_url
                }
              } as Stories;
            }));

            setStories(transformedStories);
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [currentLocation, filters, supabase]);

  // Initialize map reference
  useEffect(() => {
    if (mapRef.current && isMapLoaded) {
      const map = mapRef.current.getMap();
      setMap(map);
    }
  }, [setMap, isMapLoaded]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewport}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        onMove={(evt) => setViewport(evt.viewState)}
        onLoad={() => setIsMapLoaded(true)}
        onClick={(evt) => {
          if (!isMapLoaded) return;
          if (isCreatingPlace) {
            setNewPlaceLocation({
              latitude: evt.lngLat.lat,
              longitude: evt.lngLat.lng
            });
          }
        }}
      >
        {isMapLoaded && (
          <>
            <NavigationControl position="top-right" />
            <GeolocateControl
              position="top-right"
              trackUserLocation
              onGeolocate={(evt) => {
                const coords = {
                  latitude: evt.coords.latitude,
                  longitude: evt.coords.longitude
                };
                updateUserLocation(coords);
              }}
            />

            {/* Live users layer */}
            <LiveUsersLayer users={nearbyUsers} currentUser={currentUser} />

            {/* Place markers */}
            {filters.showPlaces && places.map((place) => (
              <PlaceMarker
                key={place.id}
                place={place}
                onClick={() => setSelectedPlace(place)}
              />
            ))}

            {/* Story markers */}
            {filters.showStories && stories.map((story) => (
              <StoryMarker
                key={story.id}
                story={story}
                onClick={() => setSelectedStory(story)}
              />
            ))}
          </>
        )}
      </Map>

      {/* UI Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Button
          isIconOnly
          color="primary"
          variant="flat"
          onPress={() => setIsFilterOpen(true)}
        >
          <Filter size={20} />
        </Button>
        <Button
          isIconOnly
          color="primary"
          variant="solid"
          onPress={() => setIsCreatingPlace(true)}
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      {/* Selected Place Card */}
      {selectedPlace && (
        <PlaceCard
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          className="absolute bottom-4 left-4 right-4 z-10"
        />
      )}

      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {/* Place Creator */}
      {isCreatingPlace && newPlaceLocation && (
        <PlaceCreator
          location={newPlaceLocation}
          onClose={() => {
            setIsCreatingPlace(false);
            setNewPlaceLocation(null);
          }}
          onLocationSelect={setNewPlaceLocation}
          onSuccess={() => {
            setIsCreatingPlace(false);
            setNewPlaceLocation(null);
          }}
        />
      )}
    </div>
  );
}