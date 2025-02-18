 import { useEffect, useRef, useState, useCallback } from 'react';
import { Map, NavigationControl, GeolocateControl, MapRef, AttributionControl } from 'react-map-gl';
import type { ErrorEvent } from 'mapbox-gl';
import type { MapboxGeoJSONFeature } from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import { Button } from '@heroui/react';
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
  PostGISPoint,
  LocationJson,
  Json,
  RPCFunctions
} from '@/types/map';


interface MapViewProps {
  initialLocation?: [number, number];
  onLocationChange?: (coords: Coordinates) => void;
  children?: React.ReactNode;
}

const DEFAULT_LOCATION: Coordinates = {
  latitude: 37.7749,
  longitude: -122.4194
};

export default function MapViewContainer({ initialLocation, onLocationChange, children }: MapViewProps) {
  return (
    <SecurityGate 
      requiredFeatureFlag="canAccessMap"
      fallbackMessage="Map access is restricted. Please ensure you have location services enabled and are not using a VPN or proxy service."
    >
      <MapView initialLocation={initialLocation} onLocationChange={onLocationChange}>
        {children}
      </MapView>
    </SecurityGate>
  );
}

const MapView: React.FC<MapViewProps> = ({ initialLocation = [DEFAULT_LOCATION.latitude, DEFAULT_LOCATION.longitude], onLocationChange, children }) => {
  const mapRef = useRef<MapRef>(null);
  const supabase = useSupabaseClient<Database & { functions: RPCFunctions }>();
  const user = useUser();
  
  // Rename to avoid conflict
  const { currentLocation: securityLocation, locationAccuracy } = useSecurityContext();
  const { setCurrentLocation: setMapLocation, viewport, setViewport, setMap } = useMap();
  
  const [places, setPlaces] = useState<Places[]>([]);
  const [stories, setStories] = useState<Stories[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Places | null>(null);
  const [selectedStory, setSelectedStory] = useState<Stories | null>(null);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [newPlaceLocation, setNewPlaceLocation] = useState<Coordinates | null>(null);
  const [nearbyUsers, setNearbyUsers] = useState<Profiles[]>([]);
  const [currentUser, setCurrentUser] = useState<Profiles | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState<MapFilters>({
    placeTypes: ['poi', 'event_venue'],
    radius: 10,
    showStories: true,
    showPlaces: true
  });

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
      const response = await fetch('https://ipapi.co/json/', { cache: 'force-cache' });
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
  const onMapError = useCallback((e: ErrorEvent) => {
    console.error('Map error:', e);
    setMapError(e.error.message || 'Error loading map');
  }, []);

  // Handle viewport changes
  const handleViewportChange = useCallback((newViewport: { latitude: number; longitude: number; zoom: number }) => {
    setViewport(newViewport);
  }, [setViewport]);

  const onMoveEnd = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap();
    const center = map.getCenter();
    handleViewportChange({
      latitude: center.lat,
      longitude: center.lng,
      zoom: map.getZoom()
    });
  }, [handleViewportChange]);

  // Handle location updates
  const handleGeolocate = useCallback((pos: GeolocationPosition) => {
    try {
      const newLocation: Coordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
      console.log('New location:', newLocation);
      setMapLocation(newLocation);
      onLocationChange?.(newLocation);

      // Update map view to center on user's location
      if (mapRef.current) {
        mapRef.current.flyTo({
          center: [newLocation.longitude, newLocation.latitude],
          zoom: 15,
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error handling geolocation:', error);
      setMapError('Failed to update location');
    }
  }, [setMapLocation, onLocationChange]);

  // Fetch current user's profile
const fetchCurrentUser = useCallback(async () => {
  if (!user) return;

  const { data, error } = await supabase
    .from('profiles')
    .select('*, location:get_location_json(profiles)')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching current user profile:', error);
    return;
  }

  if (data) {
    // Safely type cast the location data
    const locationData = data.location as unknown as LocationJson;
    if (!locationData || !('latitude' in locationData) || !('longitude' in locationData)) {
      console.log('No valid location data found');
      return;
    }

    setCurrentUser({
      ...data,
      current_location: {
        type: 'Point',
        coordinates: [locationData.longitude, locationData.latitude]
      } as PostGISPoint,
      location: locationData,
      full_name: data.full_name || null,
      avatar_url: data.avatar_url || null
    } as Profiles);
  }
}, [user, supabase]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser, supabase, user]);

  // Update user location and fetch nearby users
const updateUserLocation = useCallback(async (coords: Coordinates) => {
  if (!user) return;

  try {
    setMapLocation(coords);
    
// Update location in database with properly typed RPC call
const { error: updateError } = await(supabase.functions.invoke as any)(
  'update_profile_location',
  {
    body: {
      lat: coords.latitude,
      lon: coords.longitude
    }
  }
);

if (updateError) {
  console.error('Error updating location:', updateError);
  return;
}
    // ... rest of the function
  } catch (err) {
    console.error('Error in updateUserLocation:', err);
  }
}, [user, supabase, setMapLocation, onLocationChange]);

  useEffect(() => {
    if (securityLocation) {
      updateUserLocation({
        latitude: securityLocation.latitude,
        longitude: securityLocation.longitude
      });
    }
  }, [updateUserLocation, securityLocation]);

  // Fetch places and stories
const fetchData = useCallback(async () => {
  if (!securityLocation) return;

  try {
const { data: placesData, error: placesError } = await supabase
  .from('places')
  .select(`
    *,
    creator:profiles!places_created_by_fkey(id, full_name, avatar_url)
  `)
  .not('current_location', 'is', null)
  .returns<Places[]>();

if (placesError) {
  console.error('Error fetching places:', placesError);
} else if (placesData) {
  setPlaces(placesData.map(place => {
    const creatorData = Array.isArray(place.creator) ? place.creator[0] : null;
    
    return {
      ...place,
      current_location: place.current_location as PostGISPoint,
      location: place.current_location ? {
        latitude: (place.current_location as PostGISPoint).coordinates[1],
        longitude: (place.current_location as PostGISPoint).coordinates[0]
      } : undefined,
      creator: creatorData ? {
        id: creatorData.id,
        full_name: creatorData.full_name || null,
        avatar_url: creatorData.avatar_url || null
      } : undefined,
      metadata: place.metadata as Json
    } as Places;
  }).filter(Boolean) as Places[]);
}
  } catch (err) {
    console.error('Error in fetchData:', err);
  }
}, [securityLocation, filters.radius, filters.placeTypes, filters.showStories, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData, securityLocation, filters, supabase]);

  // Handle place creation
const handleMapClick = useCallback((event: { lngLat: { lat: number; lng: number } }) => {
  if (isCreatingPlace) {
    setNewPlaceLocation({
      latitude: event.lngLat.lat,
      longitude: event.lngLat.lng
    });
  }
}, [isCreatingPlace]);

  // Toggle place creation mode
  const togglePlaceCreation = useCallback(() => {
    setIsCreatingPlace(prev => !prev);
    if (!isCreatingPlace) {
      setNewPlaceLocation(null);
    }
  }, [isCreatingPlace]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API_KEY}
        initialViewState={{
          latitude: initialLocation[0],
          longitude: initialLocation[1],
          zoom: viewport.zoom
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        onLoad={onMapLoad}
        onError={onMapError}
        onMoveEnd={onMoveEnd}
        onClick={handleMapClick}
        cursor={isCreatingPlace ? 'crosshair' : 'grab'}
        reuseMaps
      >
        {children}
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
        <Button
          isIconOnly
          color={isCreatingPlace ? 'secondary' : 'primary'}
          variant={isCreatingPlace ? 'solid' : 'flat'}
          onPress={togglePlaceCreation}
          className="relative"
        >
          <MapPin size={20} />
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