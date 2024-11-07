export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CityBoundary {
  id: string;
  name: string;
  boundary: GeoJSON.Polygon;
  center: Coordinates;
  radius: number; // in miles
}

export interface LocationPrivacySettings {
  shareLocation: boolean;
  showDistance: boolean;
  allowLocationHistory: boolean;
}

export interface LocationState {
  currentLocation: Coordinates | null;
  selectedCity: CityBoundary | null;
  travelMode: boolean;
  locationPermission: 'granted' | 'denied' | 'prompt';
  error: Error | null;
  isLoading: boolean;
  privacySettings: LocationPrivacySettings;
}

export interface LocationContextType {
  state: LocationState;
  updateLocation: (coords: Coordinates) => Promise<void>;
  enableTravelMode: (enabled: boolean) => void;
  selectCity: (city: CityBoundary) => void;
  requestLocationPermission: () => Promise<void>;
}
