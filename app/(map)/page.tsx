'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Spinner } from '@nextui-org/spinner';
import { MapView } from '@/components/map/MapView';
import { useCallback } from 'react';
import { Coordinates } from '@/types/core';

const MapPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  const handleLocationChange = useCallback((coords: Coordinates, isVisiting?: boolean) => {
    // Handle location changes
    console.log('Location changed:', coords, isVisiting);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="h-screen w-screen">
      <MapView onLocationChange={handleLocationChange} />
    </div>
  );
};

export default MapPage;
