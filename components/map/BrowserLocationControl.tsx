'use client';

import React, { useEffect } from 'react';
import { useMap } from '@/components/contexts/MapContext';
import { Button } from '@nextui-org/react';
import { Navigation2 } from 'lucide-react';

export const BrowserLocationControl = () => {
  const { setViewport, setCurrentLocation } = useMap();

  const getBrowserLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        
        setCurrentLocation(newLocation);
        setViewport((prev: any) => ({
          ...prev,
          ...newLocation,
          zoom: 15, // Zoom in when locating user
        }));
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Request location when component mounts
  useEffect(() => {
    getBrowserLocation();
  }, []);

  return (
    <Button
      isIconOnly
      variant="flat"
      className="absolute bottom-4 right-4 z-10"
      onClick={getBrowserLocation}
    >
      <Navigation2 className="h-4 w-4" />
    </Button>
  );
};

export default BrowserLocationControl;
