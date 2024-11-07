import { createContext, useContext, useState } from 'react';
import {
  LocationState,
  LocationContextType,
  Coordinates,
  CityBoundary
} from '@/types/location.types';
import { supabase } from '@/utils/supabase/client';

const LocationContext = createContext<LocationContextType | undefined>(
  undefined
);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({
    currentLocation: null,
    selectedCity: null,
    travelMode: false,
    locationPermission: 'prompt',
    error: null,
    isLoading: false,
    privacySettings: {
      shareLocation: true,
      showDistance: true,
      allowLocationHistory: true
    }
  });

  const updateLocation = async (coords: Coordinates) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      // Update user's location in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          location: `POINT(${coords.longitude} ${coords.latitude})`,
          last_location_update: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (updateError) throw updateError;

      setState((prev) => ({
        ...prev,
        currentLocation: coords,
        isLoading: false
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to update location'),
        isLoading: false
      }));
    }
  };

  const enableTravelMode = (enabled: boolean) => {
    setState((prev) => ({ ...prev, travelMode: enabled }));
  };

  const selectCity = (city: CityBoundary) => {
    setState((prev) => ({ ...prev, selectedCity: city }));
  };

  const requestLocationPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      setState((prev) => ({
        ...prev,
        locationPermission: result.state as 'granted' | 'denied' | 'prompt'
      }));

      if (result.state === 'granted') {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            updateLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            throw new Error(`Geolocation error: ${error.message}`);
          }
        );
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error
            : new Error('Failed to request location permission')
      }));
    }
  };

  return (
    <LocationContext.Provider
      value={{
        state,
        updateLocation,
        enableTravelMode,
        selectCity,
        requestLocationPermission
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
