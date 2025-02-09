// This file is no longer needed as we're using URL parameters for drawer state management
// You can safely delete this file after updating all imports

export type OverlayView = 'chat' | 'global' | 'profile' | 'groups' | 'events' | 'stories' | null;

// Keeping the type export for now in case other files still reference it
      setActiveView('global');
    } else {
      setIsOpen(false);
      setActiveView(null);
    }
  }, [searchParams]);

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
