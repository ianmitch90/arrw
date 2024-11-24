import { useEffect, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Avatar, User } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDistance } from '@/lib/utils';
import { UserMarker } from '../markers/UserMarker';
import type { Map as MapboxMap } from 'mapbox-gl';

interface UserLayerProps {
  currentLocation: { latitude: number; longitude: number };
  onUserClick: (user: any) => void;
}

interface UserState {
  id: string;
  location: { latitude: number; longitude: number };
  status: string;
  lastSeen: Date;
  activity: string;
}

export function UserLayer({ currentLocation, onUserClick }: UserLayerProps) {
  const supabase = useSupabaseClient<Database>();
  const { current: mapRef } = useMap();
  const [users, setUsers] = useState<UserState[]>([]);
  const [clusteredPoints, setClusteredPoints] = useState<any[]>([]);

  useEffect(() => {
    if (!mapRef || !currentLocation) return;

    const map = mapRef.getMap();
    const channel = supabase.channel('user_presence');

    // Subscribe to presence updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userStates = Object.values(state).flat();
        
        // Update user locations
        setUsers(userStates.map((user: any) => ({
          id: user.user_id,
          location: user.location,
          status: user.status,
          lastSeen: new Date(user.last_seen),
          activity: user.activity
        })));
      })
      .subscribe();

    // Clean up existing source and layer if they exist
    if (map.getSource('users')) {
      if (map.getLayer('user-clusters')) {
        map.removeLayer('user-clusters');
      }
      if (map.getLayer('cluster-count')) {
        map.removeLayer('cluster-count');
      }
      map.removeSource('users');
    }

    // Add clustering source
    map.addSource('users', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layer
    map.addLayer({
      id: 'user-clusters',
      type: 'circle',
      source: 'users',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#4A90E2',
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          100,
          30,
          750,
          40
        ]
      }
    });

    // Add cluster count layer
    map.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'users',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    return () => {
      channel.unsubscribe();
      if (map.getSource('users')) {
        if (map.getLayer('user-clusters')) {
          map.removeLayer('user-clusters');
        }
        if (map.getLayer('cluster-count')) {
          map.removeLayer('cluster-count');
        }
        map.removeSource('users');
      }
    };
  }, [mapRef, currentLocation]);

  // Update source data when users change
  useEffect(() => {
    if (!mapRef || !users.length) return;

    const map = mapRef.getMap();
    const source = map.getSource('users');
    if (source && 'setData' in source) {
      source.setData({
        type: 'FeatureCollection',
        features: users.map(user => ({
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [user.location.longitude, user.location.latitude]
          },
          properties: {
            id: user.id,
            status: user.status,
            activity: user.activity
          }
        }))
      });
    }
  }, [users, mapRef]);

  return null;
}
