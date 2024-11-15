'use client';
import { createContext, useContext, useState, useCallback } from 'react';

interface AppState {
  viewMode: 'community' | 'places';
  selectedPlace: string | null;
  selectedUser: string | null;
  isChatOpen: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
  } | null;
}

interface AppContextType {
  state: AppState;
  setViewMode: (mode: 'community' | 'places') => void;
  selectPlace: (placeId: string | null) => void;
  selectUser: (userId: string | null) => void;
  toggleChat: (open: boolean) => void;
  updateLocation: (lat: number, lng: number) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>({
    viewMode: 'community',
    selectedPlace: null,
    selectedUser: null,
    isChatOpen: false,
    currentLocation: null
  });

  const setViewMode = useCallback((mode: 'community' | 'places') => {
    setState((prev) => ({ ...prev, viewMode: mode }));
  }, []);

  const selectPlace = useCallback((placeId: string | null) => {
    setState((prev) => ({ ...prev, selectedPlace: placeId }));
  }, []);

  const selectUser = useCallback((userId: string | null) => {
    setState((prev) => ({ ...prev, selectedUser: userId }));
  }, []);

  const toggleChat = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isChatOpen: open }));
  }, []);

  const updateLocation = useCallback((latitude: number, longitude: number) => {
    setState((prev) => ({
      ...prev,
      currentLocation: { latitude, longitude }
    }));
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        setViewMode,
        selectPlace,
        selectUser,
        toggleChat,
        updateLocation
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
