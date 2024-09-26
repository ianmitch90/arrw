import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN!;

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [lng, setLng] = useState<number>(-70);
  const [lat, setLat] = useState<number>(42);
  const [zoom, setZoom] = useState<number>(9);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [lng, lat],
      zoom: zoom
    });

    // Get and update location periodically
    const updateLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { longitude, latitude } = position.coords;
          setLng(longitude);
          setLat(latitude);
          map.current?.flyTo({
            center: [longitude, latitude],
            essential: true
          });

          // Update location in Supabase
          const { data, error } = await supabase.from('user_locations').upsert(
            {
              user_id: (await supabase.auth.getUser()).data.user?.id,
              latitude,
              longitude
            },
            { onConflict: 'user_id' }
          );

          if (error) console.error('Error updating location:', error);
        });
      }
    };

    updateLocation(); // Initial update
    const intervalId = setInterval(updateLocation, 5000); // Update every 5 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  return <div ref={mapContainer} style={{ width: '100%', height: '400px' }} />;
};

export default Map;
