import { createContext, useContext, useState, ReactNode } from 'react';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface LocationContextType {
  location: Coordinates | null;
  setLocation: (location: Coordinates | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <LocationContext.Provider
      value={{
        location,
        setLocation,
        error,
        setError,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
