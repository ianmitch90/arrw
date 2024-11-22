import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Coordinates, PlaceProposal } from '@/types/core';
import { Button, Card } from '@nextui-org/react';
import { Filter, Navigation } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { ProposalCluster } from './ProposalCluster';

// Initialize Mapbox
const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
console.log('Mapbox token available:', !!token);
mapboxgl.accessToken = token;

interface ProposalMapProps {
  initialLocation?: Coordinates;
}

export function ProposalMap({ initialLocation }: ProposalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const supabase = useSupabaseClient<Database>();

  const [location, setLocation] = useState<Coordinates | undefined>(initialLocation);
  const [proposals, setProposals] = useState<PlaceProposal[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<PlaceProposal[]>();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current) {
      console.error('Map container not found');
      return;
    }

    // Debug container dimensions
    const rect = mapContainer.current.getBoundingClientRect();
    console.log('Map container dimensions:', {
      width: rect.width,
      height: rect.height,
      offsetWidth: mapContainer.current.offsetWidth,
      offsetHeight: mapContainer.current.offsetHeight,
      clientWidth: mapContainer.current.clientWidth,
      clientHeight: mapContainer.current.clientHeight
    });

    // Wait for container to have dimensions
    if (rect.width === 0 || rect.height === 0) {
      console.log('Container has no dimensions, waiting...');
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          console.log('Container now has dimensions:', entry.contentRect);
          observer.disconnect();
          initializeMap();
        }
      });
      observer.observe(mapContainer.current);
      return () => observer.disconnect();
    }

    initializeMap();

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [location]);

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [location?.longitude || -122.4194, location?.latitude || 37.7749],
        zoom: 13,
        preserveDrawingBuffer: true // This can help with rendering issues
      });

      // Debug map initialization
      map.current.on('load', () => {
        console.log('Map loaded successfully');
        
        // Force a resize after load
        setTimeout(() => {
          map.current?.resize();
          console.log('Forced map resize');
        }, 100);
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
      });

      // Add controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.current.addControl(
        new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true
        }),
        'top-right'
      );
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  // Update map when location changes
  useEffect(() => {
    if (!map.current || !location) return;

    map.current.flyTo({
      center: [location.longitude, location.latitude],
      zoom: 13
    });

    // Fetch proposals for this area
    fetchNearbyProposals(location);
  }, [location]);

  const fetchNearbyProposals = async (coords: Coordinates) => {
    const { data, error } = await supabase.rpc('get_nearby_proposals', {
      lat: coords.latitude,
      lng: coords.longitude,
      radius_miles: 1 // 1 mile radius
    });

    if (error) {
      console.error('Error fetching proposals:', error);
    } else {
      setProposals(data || []);
    }
  };

  // Add markers to map
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    const markers = document.getElementsByClassName('mapboxgl-marker');
    while (markers[0]) {
      markers[0].remove();
    }

    // Group proposals by cluster
    const clusters = proposals.reduce((acc, proposal) => {
      if (!proposal.cluster_id) return acc;
      if (!acc[proposal.cluster_id]) {
        acc[proposal.cluster_id] = [];
      }
      acc[proposal.cluster_id].push(proposal);
      return acc;
    }, {} as Record<string, PlaceProposal[]>);

    // Add cluster markers
    Object.values(clusters).forEach(clusterProposals => {
      const mainProposal = clusterProposals[0];
      const el = document.createElement('div');
      
      // Create marker element
      const markerContent = document.createElement('div');
      markerContent.className = 'bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center font-medium cursor-pointer hover:bg-primary-600 transition-colors';
      markerContent.textContent = clusterProposals.length.toString();
      el.appendChild(markerContent);
      
      // Add click handler
      el.addEventListener('click', () => {
        setSelectedCluster(clusterProposals);
      });

      new mapboxgl.Marker(el)
        .setLngLat([mainProposal.location.longitude, mainProposal.location.latitude])
        .addTo(map.current!);
    });
  }, [proposals]);

  const handleApproveProposal = async (proposalId: string, mergedProposals?: string[]) => {
    // TODO: Implement approval logic
    console.log('Approving proposal:', proposalId, 'merging:', mergedProposals);
  };

  const handleRejectProposal = async (proposalId: string, reason: string) => {
    // TODO: Implement rejection logic
    console.log('Rejecting proposal:', proposalId, 'reason:', reason);
  };

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Selected Cluster */}
      {selectedCluster && (
        <Card className="absolute left-4 right-4 bottom-4">
          <ProposalCluster
            proposals={selectedCluster}
            onApprove={handleApproveProposal}
            onReject={handleRejectProposal}
          />
        </Card>
      )}

      {/* Location Indicator */}
      {location && (
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="p-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">
                Viewing 1 mile radius
              </span>
              <Button
                size="sm"
                variant="light"
                startContent={<Navigation className="w-4 h-4" />}
                onPress={() => {
                  setLocation(undefined);
                  setSelectedCluster(undefined);
                }}
              >
                Reset Location
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
