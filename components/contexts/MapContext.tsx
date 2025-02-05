'use client';

import React, {
  createContext,
  useContext,
  useState,
  ReactNode
} from 'react';
import type { Map } from 'mapbox-gl';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapContextType {
  map: Map | null;
  setMap: (map: Map | null) => void;
  currentLocation: Coordinates | null;
  setCurrentLocation: (location: Coordinates | null) => void;
  viewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
  setViewport: (viewport: { latitude: number; longitude: number; zoom: number; }) => void;
}

const DEFAULT_ZOOM = 11;

const DEFAULT_VIEWPORT = {
  latitude: 39.8283,  // Center of US
  longitude: -98.5795,
  zoom: DEFAULT_ZOOM
};

const MapContext = createContext<MapContextType | undefined>(undefined);

export function MapProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [viewport, setViewport] = useState(DEFAULT_VIEWPORT);

  return (
    <MapContext.Provider
      value={{
        map,
        setMap,
        currentLocation,
        setCurrentLocation,
        viewport,
        setViewport,
      }}
    >
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (context === undefined) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}

export { DEFAULT_ZOOM, DEFAULT_VIEWPORT };
