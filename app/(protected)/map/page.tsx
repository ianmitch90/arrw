'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { Coordinates } from '@/types/core';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// Dynamically import MapView to avoid SSR issues with map libraries
const MapView = dynamic(
  () => import('@/components/map/MapView'),
  {
    loading: () => (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    ),
    ssr: false // Important: Disable SSR for map component
  }
);

export default function MapPage() {
  const [location, setLocation] = useState<Coordinates>();
  const supabase = useSupabaseClient();

  // Handle location changes
  const handleLocationChange = async (coords: Coordinates, isVisiting?: boolean) => {
    setLocation(coords);
    
    if (isVisiting) {
      // Update user's last known location
      try {
        await supabase
          .from('users')
          .update({
            last_active_location: `POINT(${coords.longitude} ${coords.latitude})`,
            last_seen: new Date().toISOString()
          })
          .eq('id', (await supabase.auth.getUser()).data.user?.id);
      } catch (error) {
        console.error('Failed to update location:', error);
      }
    }
  };

  return (
    <div className="h-screen w-full relative">
      <div className="absolute inset-0">
        <MapView 
          initialLocation={location}
          onLocationChange={handleLocationChange}
        />
      </div>
    </div>
  );
}
