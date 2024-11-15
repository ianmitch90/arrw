import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapImplementationProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    id: string;
    type: 'user' | 'place';
    position: [number, number];
    element?: HTMLElement;
  }>;
  onMarkerClick?: (id: string, type: 'user' | 'place') => void;
}

export function MapImplementation({
  center,
  zoom,
  markers = [],
  onMarkerClick
}: MapImplementationProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Add new markers
    markers.forEach(({ id, type, position, element }) => {
      const marker = new mapboxgl.Marker(element)
        .setLngLat(position)
        .addTo(map.current!);

      if (onMarkerClick) {
        marker.getElement().addEventListener('click', () => {
          onMarkerClick(id, type);
        });
      }

      markersRef.current[id] = marker;
    });
  }, [markers, onMarkerClick]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
