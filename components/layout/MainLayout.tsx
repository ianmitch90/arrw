import { useState, useEffect } from 'react';
import { User, Coordinates, VisitingLocation } from '@/types/core';
import { TopNav } from './TopNav';
import { BottomNav } from './BottomNav';
import { StoriesBar } from '../stories/StoriesBar';
import { TabBar, TabKey } from './TabBar';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { Database } from '@/types_db';

const LazyMap = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-neutral-100" />
});

interface MainLayoutProps {
  children: React.ReactNode;
  currentUser: User;
}

export type View = 'account' | 'map' | 'chat' | 'global';

type Counts = {
  users: number;
  groups: number;
  places: number;
};

export function MainLayout({ children, currentUser }: MainLayoutProps) {
  const pathname = usePathname();
  const supabase = useSupabaseClient<Database>();
  const [currentView, setCurrentView] = useState<View>('map');
  const [currentLocation, setCurrentLocation] = useState<Coordinates | undefined>();
  const [visitingLocation, setVisitingLocation] = useState<VisitingLocation | undefined>();
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('users');
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasEventRequests, setHasEventRequests] = useState(false);

  // Mock counts for now - these will come from your data layer
  const [counts, setCounts] = useState<Counts>({
    users: 12,
    groups: 5,
    places: 8
  });

  const handleLocationChange = (coords: Coordinates, isVisiting = false) => {
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

  // Subscribe to unread messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const setupSubscriptions = async () => {
      // Ensure we have an active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const messageSubscription = supabase
        .channel('unread-messages')
        .on<Database['public']['Tables']['chat_messages']['Row']>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
            filter: `sender_id=eq.${currentUser.id}`
          },
          () => setHasUnreadMessages(true)
        )
        .subscribe();

      // Initial check for unread messages
      const { data } = await supabase
        .from('chat_messages')
        .select('id, metadata')
        .eq('sender_id', currentUser.id)
        .filter('metadata->read', 'is', null)
        .limit(1);

      setHasUnreadMessages(!!data?.length);

      return messageSubscription;
    };

    let subscription: RealtimeChannel | undefined;
    setupSubscriptions().then(sub => {
      subscription = sub;
    }).catch(error => {
      console.error('Error setting up message subscription:', error);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [currentUser?.id, supabase]);

  // Subscribe to event requests
  useEffect(() => {
    if (!currentUser?.id) return;

    const setupEventSubscriptions = async () => {
      // Ensure we have an active session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const eventSubscription = supabase
        .channel('event-requests')
        .on<Database['public']['Tables']['chat_participants']['Row']>(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_participants',
            filter: `user_id=eq.${currentUser.id} AND role=eq.pending`
          },
          () => setHasEventRequests(true)
        )
        .subscribe();

      // Initial check for pending event requests
      const { data } = await supabase
        .from('chat_participants')
        .select('id, role')
        .eq('user_id', currentUser.id)
        .eq('role', 'pending')
        .limit(1);

      setHasEventRequests(!!data?.length);

      return eventSubscription;
    };

    let subscription: RealtimeChannel | undefined;
    setupEventSubscriptions().then(sub => {
      subscription = sub;
    }).catch(error => {
      console.error('Error setting up event subscription:', error);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [currentUser?.id, supabase]);

  // Get user's current location on mount
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleLocationChange({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // For now, set a default location (Washington, DC)
          handleLocationChange({
            latitude: 38.8977,
            longitude: -77.0365
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, []);

  // Control map visibility based on route
  useEffect(() => {
    const shouldShowMap = pathname ? !pathname.startsWith('/auth') : true;
    setIsMapVisible(shouldShowMap);
  }, [pathname]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Persistent Map Layer */}
      <div 
        className={`fixed inset-0 transition-opacity duration-300 ${
          isMapVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <LazyMap 
          initialLocation={currentLocation}
          onLocationChange={handleLocationChange}
        />
      </div>

      {/* App UI Layer */}
      <div className="relative z-10 h-full flex flex-col">
        <TopNav
          currentUser={currentUser}
          currentLocation={currentLocation}
          visitingLocation={visitingLocation}
          view={currentView}
          onLocationChange={handleLocationChange}
        />
        
        {/* Stories bar - only show on map view */}
        {currentView === 'map' && (
          <>
            <StoriesBar
              location={visitingLocation?.coordinates || currentLocation}
              radius={visitingLocation?.radius || 10}
            />
            <TabBar 
              activeTab={activeTab}
              onTabChange={setActiveTab}
              userCount={counts.users}
              groupCount={counts.groups}
              placeCount={counts.places}
            />
          </>
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
    </div>
  );
}