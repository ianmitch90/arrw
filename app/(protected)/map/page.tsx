'use client';

import dynamic from 'next/dynamic';
import { Spinner } from '@heroui/react';
import { useState } from 'react';
import { Coordinates } from '@/types/core';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UserLocations } from '@/components/map/UserLocations';

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
  const supabase = createClientComponentClient();

  // Handle location changes
  const handleLocationChange = async (coords: Coordinates) => {
    console.log('Location changed:', coords);
    setLocation(coords);
    
    // Update user's last known location
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      console.log('Updating location for user:', user.id);
      const { data, error: updateError } = await supabase
        .rpc('update_profile_location', {
          profile_id: user.id,
          lat: coords.latitude,
          lon: coords.longitude
        });

      if (updateError) {
        throw updateError;
      }
      console.log('Location updated successfully:', data);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  return (
    <div className="h-screen w-full relative">
      <div className="absolute inset-0">
        <MapView 
          initialLocation={location}
          onLocationChange={handleLocationChange}
        >
          <UserLocations />
        </MapView>
      </div>
    </div>
  );
}
