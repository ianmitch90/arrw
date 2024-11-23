'use client';

import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren
} from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface MapContextType {
  viewport: any;
  setViewport: React.Dispatch<React.SetStateAction<any>>;
  currentLocation: Coordinates | undefined;
  setCurrentLocation: (location: Coordinates | undefined) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [viewport, setViewport] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 10,
    width: '100vw',
    height: '100vh'
  });

  const [currentLocation, setCurrentLocation] = useState<Coordinates | undefined>(undefined);

  return (
    <MapContext.Provider value={{ viewport, setViewport, currentLocation, setCurrentLocation }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
};
