 import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, GeolocateControl, MapRef, AttributionControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import { Button } from '@nextui-org/react';
import { Filter, MapPin } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { PlaceCard } from './PlaceCard';
import { StoryMarker } from './StoryMarker';
import { LiveUsersLayer } from './LiveUsersLayer';
import { PlaceMarker } from './PlaceMarker';
import { StoryViewer } from '../stories/StoryViewer';
import { PlaceCreator } from './PlaceCreator';
import { useMap } from '@/components/contexts/MapContext';
import { SecurityGate } from '@/security/SecurityGate';
import { useSecurityContext } from '@/contexts/SecurityContext';
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

const DEFAULT_LOCATION: Coordinates = {
  latitude: 37.7749,
  longitude: -122.4194
};

export default function MapViewContainer({ initialLocation, onLocationChange }: MapViewProps) {
  return (
    <SecurityGate 
      requiredFeatureFlag="canAccessMap"
      fallbackMessage="Map access is restricted. Please ensure you have location services enabled and are not using a VPN or proxy service."
    >
      <MapView initialLocation={initialLocation} onLocationChange={onLocationChange} />
    </SecurityGate>
  );
}

function MapView({ initialLocation, onLocationChange }: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl>();
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  
  // Rename to avoid conflict
  const { currentLocation: securityLocation, locationAccuracy } = useSecurityContext();
  const { setCurrentLocation: setMapLocation, viewport, setViewport, setMap } = useMap();
  
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
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    placeTypes: ['poi', 'event_venue'],
    radius: 10,
    showStories: true,
    showPlaces: true
  });

  const [hasLocationPermission, setHasLocationPermission] = useState(false);

  // Check for geolocation permission
  useEffect(() => {
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then(permissionStatus => {
          setHasLocationPermission(permissionStatus.state === 'granted');
          
          permissionStatus.onchange = () => {
            setHasLocationPermission(permissionStatus.state === 'granted');
          };
        });
    }
  }, []);

  // Handle geolocation errors
  const handleGeolocationError = useCallback((error: GeolocationPositionError) => {
    console.error('Geolocation error:', error);
    switch (error.code) {
      case error.PERMISSION_DENIED:
        setMapError('Location access denied. Please enable location services.');
        break;
      case error.POSITION_UNAVAILABLE:
        setMapError('Location information is unavailable.');
        break;
      case error.TIMEOUT:
        setMapError('Location request timed out.');
        break;
      default:
        setMapError('An unknown error occurred.');
    }
  }, []);

  // Get location with fallbacks
  const getUserLocation = useCallback(async (): Promise<Coordinates> => {
    setIsLoadingLocation(true);
    console.log('Getting user location...');

    // Try precise location first
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            { 
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        });
        
        console.log('Got precise location:', position.coords);
        setIsLoadingLocation(false);
        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch (error) {
        console.log('Precise location failed, trying IP-based location:', error);
      }
    }

    // Fallback to IP-based location
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('Got IP-based location:', data);
        setIsLoadingLocation(false);
        return {
          latitude: data.latitude,
          longitude: data.longitude
        };
      }
    } catch (error) {
      console.error('IP location failed:', error);
    }

    // Final fallback to default location
    console.log('Using default location');
    setIsLoadingLocation(false);
    return DEFAULT_LOCATION;
  }, []);

  // Center map on user location
  const centerOnUser = useCallback(() => {
    if (!securityLocation) {
      setMapError('Location not available');
      return;
    }

    if (mapRef.current) {
      const map = mapRef.current.getMap();
      map.flyTo({
        center: [securityLocation.longitude, securityLocation.latitude],
        zoom: locationAccuracy === 'high' ? 15 : 12,
        essential: true
      });
    }
  }, [securityLocation, locationAccuracy]);

  // Handle map load
  const onMapLoad = useCallback(async () => {
    console.log('Map load started...');
    if (mapRef.current) {
      const map = mapRef.current.getMap();
      setMap(map);
      setIsMapLoaded(true);

      // Basic map configuration
      map.setMaxZoom(18);
      map.setMinZoom(8);

      // Use security context location if available
      if (securityLocation) {
        console.log('Using security context location:', securityLocation);
        map.flyTo({
          center: [securityLocation.longitude, securityLocation.latitude],
          zoom: locationAccuracy === 'high' ? 15 : 12,
          essential: true
        });
        setMapLocation({
          latitude: securityLocation.latitude,
          longitude: securityLocation.longitude
        });
      }
    }
  }, [setMap, securityLocation, locationAccuracy, setMapLocation]);

  // Handle map errors
  const onMapError = useCallback((e: any) => {
    console.error('Map error:', e);
    setMapError(e.message || 'Error loading map');
  }, []);

  // Handle viewport changes
  const onMoveEnd = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const center = map.getCenter();
    setViewport({
      latitude: center.lat,
      longitude: center.lng,
      zoom: map.getZoom()
    });
  }, [setViewport]);

  // Handle location updates
  const handleGeolocate = useCallback((pos: GeolocationPosition) => {
    try {
      const newLocation = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      console.log('New location:', newLocation);
      setMapLocation(newLocation);
      if (onLocationChange) {
        onLocationChange(newLocation);
      }
    } catch (error) {
      console.error('Error handling geolocation:', error);
      setMapError('Failed to update location');
    }
  }, [setMapLocation, onLocationChange]);

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
      setMapLocation(coords);
      
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
  }, [user, supabase, filters.radius, setMapLocation, onLocationChange]);

  // Fetch places and stories
  useEffect(() => {
    if (!securityLocation) return;

    const fetchData = async () => {
      try {
        // Fetch nearby places
        const { data: placesData, error: placesError } = await supabase
          .rpc('find_places_within_radius', {
            user_lat: securityLocation.latitude,
            user_lng: securityLocation.longitude,
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
              user_lat: securityLocation.latitude,
              user_lng: securityLocation.longitude,
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
  }, [securityLocation, filters, supabase]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        initialViewState={{
          latitude: initialLocation?.latitude || viewport.latitude,
          longitude: initialLocation?.longitude || viewport.longitude,
          zoom: viewport.zoom
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={onMapLoad}
        onError={onMapError}
        onMoveEnd={onMoveEnd}
        reuseMaps
      >
        <AttributionControl position="bottom-right" />
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
          showAccuracyCircle
          onError={handleGeolocationError}
          onGeolocate={handleGeolocate}
        />
        
        {/* Only render markers after map is loaded */}
        {isMapLoaded && (
          <>
            <LiveUsersLayer users={nearbyUsers} currentUser={currentUser} />
            
            {filters.showPlaces && places.map(place => (
              <PlaceMarker
                key={place.id}
                place={place}
                onClick={() => setSelectedPlace(place)}
              />
            ))}
            
            {filters.showStories && stories.map(story => (
              <StoryMarker
                key={story.id}
                story={story}
                onClick={() => setSelectedStory(story)}
              />
            ))}
          </>
        )}
      </Map>

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error display */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90">
          <div className="text-center p-4 bg-background rounded-lg shadow-lg">
            <p className="text-destructive mb-2">Error loading map</p>
            <p className="text-sm text-muted-foreground">{mapError}</p>
          </div>
        </div>
      )}

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
          onPress={centerOnUser}
          isDisabled={!securityLocation}
          className="relative"
        >
          {isLoadingLocation ? (
            <div className="animate-spin">⌛</div>
          ) : (
            <>
              <MapPin size={20} />
              {locationAccuracy === 'low' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full" 
                     title="Using approximate location" />
              )}
              {locationAccuracy === 'high' && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full" 
                     title="Using precise location" />
              )}
            </>
          )}
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