import { Database } from '@/types_db';
import { Dispatch, SetStateAction } from 'react';

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
export type Profiles = Omit<BaseProfile, 'current_location'> & {
  current_location?: PostGISPoint;
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
  location: Coordinates;
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
