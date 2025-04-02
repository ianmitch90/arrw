'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type OverlayView = 'chat' | 'global' | 'profile' | 'groups' | 'events' | 'stories' | null;

interface OverlayContextType {
  isOpen: boolean;
  activeView: OverlayView;
  selectedId: string | null;
  openOverlay: (view: OverlayView) => void;
  closeOverlay: () => void;
  setSelectedId: (id: string | null) => void;
}

const OverlayContext = createContext<OverlayContextType | undefined>(undefined);

interface OverlayProviderProps {
  children: ReactNode;
}

export function OverlayProvider({ children }: OverlayProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeView, setActiveView] = useState<OverlayView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // These are kept for compatibility but URL changes are handled in components
  const openOverlay = (view: OverlayView) => {
    setIsOpen(true);
    setActiveView(view);
  };

  const closeOverlay = () => {
    setIsOpen(false);
    setActiveView(null);
  };

  return (
    <OverlayContext.Provider
      value={{
        isOpen,
        activeView,
        selectedId,
        openOverlay,
        closeOverlay,
        setSelectedId,
      }}
    >
      {children}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const context = useContext(OverlayContext);
  if (context === undefined) {
    throw new Error('useOverlay must be used within an OverlayProvider');
  }
  return context;
}
