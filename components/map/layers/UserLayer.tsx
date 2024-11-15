import { useEffect, useState } from 'react';
import { Layer, Source, useMap } from 'react-map-gl';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { Avatar, User } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { calculateDistance } from '@/lib/utils';
import { UserMarker } from '../markers/UserMarker';

interface UserLayerProps {
  currentLocation: { latitude: number; longitude: number };
  onUserClick: (user: any) => void;
}

export function UserLayer({ currentLocation, onUserClick }: UserLayerProps) {
  const supabase = useSupabaseClient<Database>();
  const { current: map } = useMap();
  const [users, setUsers] = useState<any[]>([]);
  const [clusteredPoints, setClusteredPoints] = useState<any[]>([]);

  useEffect(() => {
    if (!map || !currentLocation) return;

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

    // Add clustering source and layer
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

    map.addLayer({
      id: 'user-clusters',
      type: 'circle',
      source: 'users',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': [
          'step',
          ['get', 'point_count'],
          '#6366f1', // primary-500
          10,
          '#4f46e5', // primary-600
          30,
          '#4338ca' // primary-700
        ],
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          20,
          10,
          30,
          30,
          40
        ]
      }
    });

    return () => {
      channel.unsubscribe();
      if (map.getLayer('user-clusters')) map.removeLayer('user-clusters');
      if (map.getSource('users')) map.removeSource('users');
    };
  }, [map, currentLocation]);

  // Update clustered points when users change or map moves
  useEffect(() => {
    if (!map || !users.length) return;

    const features = users.map(user => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [user.location.longitude, user.location.latitude]
      },
      properties: {
        id: user.id,
        status: user.status,
        lastSeen: user.lastSeen,
        activity: user.activity
      }
    }));

    const source = map.getSource('users');
    if (source && 'setData' in source) {
      source.setData({
        type: 'FeatureCollection',
        features
      });
    }
  }, [users, map]);

  return (
    <>
      <AnimatePresence>
        {users.map(user => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <UserMarker
              user={user}
              onClick={() => onUserClick(user)}
              distance={calculateDistance(
                currentLocation,
                user.location
              )}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </>
  );
}
