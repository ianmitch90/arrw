import { useState, useEffect } from 'react';
import { User, Coordinates, VisitingLocation } from '@/types/core';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { StoriesBar } from '../stories/StoriesBar';

interface MainLayoutProps {
  children: React.ReactNode;
  currentUser: User;
}

export type View = 'account' | 'map' | 'chat' | 'global';

export function MainLayout({ children, currentUser }: MainLayoutProps) {
  const [currentView, setCurrentView] = useState<View>('map');
  const [currentLocation, setCurrentLocation] = useState<Coordinates>();
  const [visitingLocation, setVisitingLocation] = useState<VisitingLocation>();
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasEventRequests, setHasEventRequests] = useState(false);

  const handleLocationChange = (coords: Coordinates, isVisiting: boolean = false) => {
    if (isVisiting) {
      setVisitingLocation({
        coordinates: coords,
        radius: 10, // Default 10 mile radius
      });
    } else {
      setCurrentLocation(coords);
      setVisitingLocation(undefined);
    }
  };

  // Get user's current location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationChange({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav
        currentUser={currentUser}
        currentLocation={currentLocation}
        visitingLocation={visitingLocation}
        view={currentView}
        onLocationChange={handleLocationChange}
      />
      
      {/* Stories bar - only show on map view */}
      {currentView === 'map' && (
        <StoriesBar
          location={visitingLocation?.coordinates || currentLocation}
          radius={visitingLocation?.radius || 10}
        />
      )}

      <main className="flex-1 overflow-hidden">
        {children}
      </main>

      <BottomNav
        currentView={currentView}
        onViewChange={setCurrentView}
        hasUnreadMessages={hasUnreadMessages}
        hasEventRequests={hasEventRequests}
      />
    </div>
  );
}