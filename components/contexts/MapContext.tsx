'use client';

import React, {
  createContext,
  useContext,
  useState,
  PropsWithChildren
} from 'react';

interface MapContextType {
  viewport: any;
  setViewport: React.Dispatch<React.SetStateAction<any>>;
}

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [viewport, setViewport] = useState({
    latitude: 51.3233379650232,
    longitude: -0.481747846041145,
    zoom: 10,
    width: '100vw',
    height: '100vh'
  });

  return (
    <MapContext.Provider value={{ viewport, setViewport }}>
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
