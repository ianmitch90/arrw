 import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Coordinates, Place, Story, UserProfile } from '@/types/core';
import { Button } from '@nextui-org/react';
import { Filter, Plus } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { PlaceCard } from './PlaceCard';
import { StoryMarker } from './StoryMarker';
import { UserMarker } from './UserMarker';
import { createRoot } from 'react-dom/client';
import { PlaceMarker } from './PlaceMarker';
import { StoryViewer } from '../stories/StoryViewer';
import { PlaceCreator } from './PlaceCreator';
import { useMap } from '@/components/contexts/MapContext';
import '@/types/rpc';

// Initialize Mapbox
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
console.log('Mapbox token available:', !!token);
mapboxgl.accessToken = token;

interface MapViewProps {
  initialLocation?: Coordinates;
  onLocationChange?: (coords: Coordinates, isVisiting?: boolean) => void;
}

export default function MapView({ initialLocation, onLocationChange }: MapViewProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const { currentLocation, setCurrentLocation, viewport, setViewport } = useMap();
  const [places, setPlaces] = useState<Place[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place>();
  const [selectedStory, setSelectedStory] = useState<Story>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [newPlaceLocation, setNewPlaceLocation] = useState<Coordinates>();
  const [nearbyUsers, setNearbyUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [filters, setFilters] = useState({
    placeTypes: ['poi', 'event_venue'],
    radius: 10,
    showStories: true,
    showPlaces: true
  });

  // Get user's location and update in Supabase
  const updateUserLocation = useCallback(async (coords: Coordinates) => {
    if (!user) return;

    try {
      // Update current location state
      setCurrentLocation(coords);
      
      // Update user's location in Supabase
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
          last_updated: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating location:', updateError);
        return;
      }

      // Call the onLocationChange callback if provided
      onLocationChange?.(coords);

      // Fetch nearby users after updating location
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
        // Filter out current user from nearby users
        setNearbyUsers(nearbyData.filter((u:any) => u.id !== user.id));
      }
    } catch (err) {
      console.error('Error in updateUserLocation:', err);
    }
  }, [user, supabase, filters.radius, setCurrentLocation, onLocationChange]);

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const coords = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
    updateUserLocation(coords);
  }, [updateUserLocation]);

  // Initialize user location tracking
  useEffect(() => {
    // Check if geolocation is available
    if (!user || !navigator?.geolocation) {
      console.warn('Geolocation is not available');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    const errorHandler = (error: GeolocationPositionError) => {
      console.error('Geolocation error:', error);
    };

    // Get initial position
    const positionPromise = navigator.geolocation.getCurrentPosition(
      handlePositionUpdate,
      errorHandler,
      options
    );

    let watchId: number | null = null;
    
    try {
      // Set up location watching
      watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        errorHandler,
        options
      );
      
      // Store the watch ID
      watchIdRef.current = watchId;
    } catch (error) {
      console.error('Error setting up location watch:', error);
    }

    // Cleanup function
    return () => {
      try {
        if (watchId !== null && navigator?.geolocation) {
          navigator.geolocation.clearWatch(watchId);
          watchIdRef.current = null;
        }
      } catch (error) {
        console.error('Error cleaning up location watch:', error);
      }
    };
  }, [user, handlePositionUpdate]);

  // Fetch current user profile
  useEffect(() => {
    async function fetchCurrentUser() {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching current user:', error);
          return;
        }

        setCurrentUser(data);
      } catch (err) {
        console.error('Error in fetchCurrentUser:', err);
      }
    }

    fetchCurrentUser();
  }, [user, supabase]);

  // Initialize map with user's location
  useEffect(() => {
    if (!mapContainer.current) return;

    console.log('Initializing map with container:', mapContainer.current);
    
    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: currentLocation 
          ? [currentLocation.longitude, currentLocation.latitude]
          : [-122.4194, 37.7749], // Default to SF if no location
        zoom: 13,
        preserveDrawingBuffer: true
      });

      // Add CSS to ensure map canvas fills container
      const canvas = mapContainer.current.querySelector('.mapboxgl-canvas');
      if (canvas) {
        (canvas as HTMLElement).style.width = '100%';
        (canvas as HTMLElement).style.height = '100%';
      }

      console.log('Map instance created:', !!map.current);

      // Add error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
      });

      map.current.on('load', () => {
        console.log('Map loaded successfully');
        // Force a resize to ensure the map fills its container
        map.current?.resize();
      });

      map.current.on('style.load', () => {
        console.log('Map style loaded successfully');
      });

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );

      // Ensure map fills container on window resize
      const resizeHandler = () => {
        map.current?.resize();
      };
      window.addEventListener('resize', resizeHandler);

      // Cleanup
      return () => {
        window.removeEventListener('resize', resizeHandler);
        map.current?.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [currentLocation]);

  // Update map when location changes
  useEffect(() => {
    if (!map.current || !currentLocation) return;

    map.current.flyTo({
      center: [currentLocation.longitude, currentLocation.latitude],
      zoom: 13
    });
  }, [currentLocation]);

  // Fetch places and stories when location or filters change
  useEffect(() => {
    if (!currentLocation) return;

    const fetchData = async () => {
      await fetchNearbyPlaces(currentLocation);
      await fetchNearbyStories(currentLocation);
    };

    fetchData();

    // Subscribe to real-time updates
    const radius = filters.radius * 0.014; // Rough conversion from miles to degrees
    const channel = supabase
      .channel('map_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `location @ ST_MakeEnvelope(
            ${currentLocation.longitude - radius},
            ${currentLocation.latitude - radius},
            ${currentLocation.longitude + radius},
            ${currentLocation.latitude + radius}
          )`
        },
        (payload) => {
          setStories(current => [payload.new as Story, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentLocation, filters, supabase]);

  // Handle map click for place creation
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCreatingPlace) return;

    // Get click coordinates relative to map container
    const rect = mapContainer.current?.getBoundingClientRect();
    if (!rect || !map.current) return;

    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    // Convert point to LngLat
    const lngLat = map.current.unproject([point.x, point.y]);
    setNewPlaceLocation({
      longitude: lngLat.lng,
      latitude: lngLat.lat
    });
  };

  const fetchNearbyPlaces = async (coords: Coordinates) => {
    if (!filters.showPlaces) {
      setPlaces([]);
      return;
    }

    const { data: placesData, error: placesError } = await supabase
      .rpc('get_nearby_places', {
        lat: coords.latitude,
        lng: coords.longitude,
        radius_miles: filters.radius,
        place_types: filters.placeTypes
      });

    if (placesError) {
      console.error('Error fetching places:', placesError);
    } else {
      setPlaces(placesData || []);
    }
  };

  const fetchNearbyStories = async (coords: Coordinates) => {
    if (!filters.showStories) {
      setStories([]);
      return;
    }

    const { data: storiesData, error: storiesError } = await supabase
      .rpc('get_nearby_stories', {
        lat: coords.latitude,
        lng: coords.longitude,
        radius_miles: filters.radius
      });

    if (storiesError) {
      console.error('Error fetching stories:', storiesError);
    } else {
      setStories(storiesData || []);
    }
  };

  // Add markers to map
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers[0]) {
      markers[0].remove();
    }

    // Add place markers
    places.forEach(place => {
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(
        <PlaceMarker
          place={place}
          onClick={() => setSelectedPlace(place)}
          isSelected={selectedPlace?.id === place.id}
        />
      );
      
      new mapboxgl.Marker(el)
        .setLngLat([place.location.longitude, place.location.latitude])
        .addTo(map.current!);
    });

    // Add story markers
    stories.forEach(story => {
      const el = document.createElement('div');
      const root = createRoot(el);
      root.render(
        <StoryMarker
          story={story}
          onClick={() => setSelectedStory(story)}
        />
      );
      
      new mapboxgl.Marker(el)
        .setLngLat([story.location.longitude, story.location.latitude])
        .addTo(map.current!);
    });
  }, [places, stories, selectedPlace]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" onClick={handleMapClick} />
      
      {/* User Markers */}
      {currentUser && currentLocation && (
        <UserMarker
          user={{
            ...currentUser,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            status: 'online' // Current user is always online
          }}
          isCurrentUser
        />
      )}
      
      {nearbyUsers
        .filter(nearbyUser => nearbyUser.id !== currentUser?.id) // Don't show current user twice
        .map(user => (
          <UserMarker
            key={user.id}
            user={user}
            onClick={() => {
              // Handle click on nearby user
              console.log('Clicked on user:', user);
            }}
          />
        ))}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <Button
          isIconOnly
          color="primary"
          aria-label="Filter"
          onClick={() => setIsFilterOpen(true)}
        >
          <Filter />
        </Button>
        <Button
          isIconOnly
          color="primary"
          aria-label="Add Place"
          onClick={() => setIsCreatingPlace(true)}
        >
          <Plus />
        </Button>
      </div>

      {/* Filters Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      {/* Place Creator */}
      {newPlaceLocation && (
        <PlaceCreator
          location={newPlaceLocation}
          onClose={() => {
            setIsCreatingPlace(false);
            setNewPlaceLocation(undefined);
          }}
          onSuccess={() => {
            setIsCreatingPlace(false);
            setNewPlaceLocation(undefined);
            if (currentLocation) {
              fetchNearbyPlaces(currentLocation);
            }
          }}
        />
      )}

      {/* Selected Place Card */}
      {selectedPlace && (
        <div className="absolute bottom-4 left-4 w-80">
          <PlaceCard place={selectedPlace} onClose={() => setSelectedPlace(undefined)} />
        </div>
      )}

      {/* Selected Story */}
      {selectedStory && (
        <div className="absolute inset-0 z-50">
          <StoryViewer story={selectedStory} onClose={() => setSelectedStory(undefined)} />
        </div>
      )}
    </div>
  );
}