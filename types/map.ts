import { Database } from '@/types_db';
import { Dispatch, SetStateAction } from 'react';
import type { GeolocateControlProps, ControlPosition } from 'react-map-gl';

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type PostGISPoint = {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs?: {
    type: string;
    properties: {
      name: string;
    };
  };
};

export interface LocationJson {
  latitude: number;
  longitude: number;
  last_update: string;
}

export interface LocationUpdate {
  lat: number;
  lon: number;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PlaceType = 'poi' | 'event_venue' | 'user_created';

export type Places = Database['public']['Tables']['places']['Row'] & {
  creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  location?: LocationJson;
  created_at: string | null;
  created_by: string | null;
  description: string | null;
  current_location: PostGISPoint; 
  metadata: Json;
  name: string;
  photo_url: string | null;
  place_type: string;
  status: string | null;
  updated_at: string | null;
};

export type Stories = Database['public']['Tables']['stories']['Row'] & {
  user: {
    avatar_url: string;
    full_name: string;
  };
  story_content: {
    type: string;
    url: string;
    thumbnail_url: string | null;
  };
};

// Extend the base Profile type from the database
type BaseProfile = Database['public']['Tables']['profiles']['Row'];

// Add our custom fields and type the geography field
export type Profiles = Omit<BaseProfile, 'current_location' | 'location'> & {
  current_location?: PostGISPoint;
  location?: LocationJson;
  last_location_update?: string | null;
  age_verification_method: 'modal' | 'document' | null;
  age_verified: boolean | null;
  age_verified_at: string | null;
  avatar_url: string | null;
  full_name: string | null;
  updated_at: string | null;
  username: string | null;
  website: string | null;
};

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
}

export interface MapFilters {
  placeTypes: PlaceType[];
  radius: number;
  showStories: boolean;
  showPlaces: boolean;
}

export interface PlaceCardProps {
  place: Places;
  onClose: () => void;
  className?: string;
}

export interface PlaceCreatorProps {
  location: Coordinates | null;
  onClose: () => void;
  onLocationSelect?: Dispatch<SetStateAction<Coordinates | null>>;
}

export interface StoryViewerProps {
  story: Stories;
  onClose: () => void;
}

export interface PlaceMarkerProps {
  place: Places;
  onClick: () => void;
}

export interface StoryMarkerProps {
  story: Stories;
  onClick: () => void;
}

export interface LiveUsersLayerProps {
  users: Profiles[];
  currentUser: Profiles | null;
}

export interface ExtendedGeolocateControlProps extends GeolocateControlProps {
  position?: ControlPosition;
  auto?: boolean;
}

export type RPCFunctions = {
  update_profile_location: {
    body: { lat: number; lon: number };
    response: void;
  };
  get_location_json: {
    body: { places: any };
    response: LocationJson;
  };
};

export interface MapViewProps {
  initialLocation?: [number, number];
  onLocationChange?: (coords: Coordinates) => void;
  children?: React.ReactNode;
}