import { PostGISPoint } from './index';

/** Simple coordinates interface for basic latitude/longitude pairs */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** Represents a city boundary with PostGIS geometry */
export interface CityBoundary {
  id: string;
  name: string;
  boundary: GeoJSON.Polygon;
  center: PostGISPoint;
  radius: number; // in miles
}

/** User's location privacy settings */
export interface LocationPrivacySettings {
  shareLocation: boolean;
  showDistance: boolean;
  allowLocationHistory: boolean;
}

/** Location state for the application */
export interface LocationState {
  currentLocation: PostGISPoint | null;
  selectedCity: CityBoundary | null;
  travelMode: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  error: Error | null;
  isLoading: boolean;
  privacySettings: LocationPrivacySettings;
}

/** Location context type for React context */
export interface LocationContextType {
  state: LocationState;
  updateLocation: (coords: Coordinates) => Promise<void>;
  enableTravelMode: (enabled: boolean) => void;
  selectCity: (city: CityBoundary) => void;
  requestLocationPermission: () => Promise<void>;
}

/** Convert coordinates to PostGIS point format */
export function toPostGISPoint(coords: Coordinates): PostGISPoint {
  return {
    type: 'Point',
    coordinates: [coords.longitude, coords.latitude],
    crs: {
      type: 'name',
      properties: {
        name: 'EPSG:4326'
      }
    }
  };
}

/** Convert PostGIS point to coordinates */
export function toCoordinates(point: PostGISPoint): Coordinates {
  return {
    latitude: point.coordinates[1],
    longitude: point.coordinates[0]
  };
}
