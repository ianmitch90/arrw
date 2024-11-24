import { Database } from '@/types_db';

// Define the PostGIS point type (shared with User type)
export interface PostGISPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
  crs?: {
    type: 'name';
    properties: {
      name: 'urn:ogc:def:crs:EPSG::4326';
    };
  };
}

export type PlaceType = 'poi' | 'event_venue' | 'user_created' | 'other';

export interface Place {
  id: string;
  name: string;
  description: string;
  location: PostGISPoint;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  icon: string;
  metadata: Record<string, any> | null;
  place_type: PlaceType;
  photo_url?: string;
  creator?: {
    avatar_url?: string;
    full_name?: string;
  };
}
