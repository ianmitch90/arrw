 import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Coordinates, Place, Story } from '@/types/core';
import { Button, Card, ScrollShadow } from '@nextui-org/react';
import { Filter, MapPin, Navigation, Plus } from 'lucide-react';
import { FilterPanel } from './FilterPanel';
import { PlaceCard } from './PlaceCard';
import { StoryMarker } from './StoryMarker';
import { createRoot } from 'react-dom/client';
import { PlaceMarker } from './PlaceMarker';
import { StoryViewer } from '../stories/StoryViewer';
import { PlaceCreator } from './PlaceCreator';

// Initialize Mapbox
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapViewProps {
  initialLocation?: Coordinates;
  onLocationChange: (coords: Coordinates, isVisiting?: boolean) => void;
}

export function MapView({ initialLocation, onLocationChange }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const supabase = useSupabaseClient<Database>();

  const [location, setLocation] = useState<Coordinates | undefined>(initialLocation);
  const [places, setPlaces] = useState<Place[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place>();
  const [selectedStory, setSelectedStory] = useState<Story>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreatingPlace, setIsCreatingPlace] = useState(false);
  const [newPlaceLocation, setNewPlaceLocation] = useState<Coordinates>();
  const [filters, setFilters] = useState({
    placeTypes: ['poi', 'event_venue'],
    radius: 10,
    showStories: true,
    showPlaces: true
  });

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [location?.longitude || -122.4194, location?.latitude || 37.7749],
      zoom: 13
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

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, []);

  // Update map when location changes
  useEffect(() => {
    if (!map.current || !location) return;

    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 13
    });
  }, [location]);

  // Fetch places and stories when location or filters change
  useEffect(() => {
    if (!location) return;

    const fetchData = async () => {
      await fetchNearbyPlaces(location);
      await fetchNearbyStories(location);
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
            ${location.longitude - radius},
            ${location.latitude - radius},
            ${location.longitude + radius},
            ${location.latitude + radius}
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
  }, [location, filters, supabase]);

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

  const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
    const { lng, lat } = e.lngLat;
    
    if (isCreatingPlace) {
      setNewPlaceLocation({ longitude: lng, latitude: lat });
    } else {
      setLocation({ longitude: lng, latitude: lat });
      onLocationChange({ longitude: lng, latitude: lat }, true);
    }
  };

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        onClick={handleMapClick}
      />

      {/* Filter and Create Buttons */}
      <div className="absolute top-4 left-4 flex gap-2">
        <Button
          isIconOnly
          color="primary"
          variant="solid"
          onPress={() => setIsFilterOpen(true)}
        >
          <Filter className="w-5 h-5" />
        </Button>
        <Button
          isIconOnly
          color={isCreatingPlace ? 'default' : 'primary'}
          variant={isCreatingPlace ? 'flat' : 'solid'}
          onPress={() => {
            setIsCreatingPlace(!isCreatingPlace);
            if (isCreatingPlace) {
              setNewPlaceLocation(undefined);
            }
          }}
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
      />

      {/* Place Creator */}
      {isCreatingPlace && newPlaceLocation && (
        <Card className="absolute left-4 right-4 bottom-4 p-4">
          <PlaceCreator
            lat={newPlaceLocation.latitude}
            lng={newPlaceLocation.longitude}
            onSuccess={() => {
              setIsCreatingPlace(false);
              setNewPlaceLocation(undefined);
              // Refresh places
              if (location) {
                fetchNearbyPlaces(location);
              }
            }}
            onCancel={() => {
              setIsCreatingPlace(false);
              setNewPlaceLocation(undefined);
            }}
          />
        </Card>
      )}

      {/* Creation Instructions */}
      {isCreatingPlace && !newPlaceLocation && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-background/80 backdrop-blur-md rounded-lg shadow-lg">
          <p className="text-sm text-center">
            Click on the map to select a location for your new place
          </p>
        </div>
      )}

      {/* Selected Place Card */}
      {!isCreatingPlace && selectedPlace && (
        <Card className="absolute left-4 right-4 bottom-4 p-4">
          <PlaceCard
            place={selectedPlace}
            onClose={() => setSelectedPlace(undefined)}
          />
        </Card>
      )}

      {/* Story Viewer */}
      {selectedStory && (
        <StoryViewer
          story={selectedStory}
          onClose={() => setSelectedStory(undefined)}
        />
      )}

      {/* Location Indicator */}
      {location && (
        <div className="absolute bottom-20 left-4 right-4">
          <Card className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  Viewing {filters.radius} mile radius
                </span>
              </div>
              <Button
                size="sm"
                variant="light"
                startContent={<Navigation className="w-4 h-4" />}
                onPress={() => {
                  setLocation(undefined);
                  onLocationChange({ longitude: 0, latitude: 0 }, false);
                }}
              >
                Reset Location
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}