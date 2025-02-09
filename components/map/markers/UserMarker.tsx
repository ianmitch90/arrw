import { Avatar, Chip, Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { cn } from '@/utils/cn';
import { Marker, Source, Layer } from 'react-map-gl';
import { Database } from '@/types_db';

type Profile = Database['public']['Tables']['profiles']['Row']

interface UserMarkerProps {
  user: {
    id: string;
    presence_status: Profile['presence_status'];
    last_seen_at: string;
    current_location: {
      latitude: number;
      longitude: number;
    };
    location_accuracy: number | null;
    location_sharing: Profile['location_sharing'];
    avatar_url: string | null;
    full_name: string | null;
  };
  onClick?: () => void;
  distance: number;
}

export function UserMarker({ user, onClick, distance }: UserMarkerProps) {
  const isOnline = user.presence_status === 'online';
  const [showPresence, setShowPresence] = useState(false);

  return (
    <>
      {/* Privacy Radius Circle */}
      {user.location_sharing !== 'public' && user.location_accuracy !== null && (
        <Source
          id={`privacy-area-${user.id}`}
          type="geojson"
          data={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [user.current_location.longitude, user.current_location.latitude]
            },
            properties: {
              radius: user.location_accuracy,
              lat: user.current_location.latitude
            }
          }}
        >
          <Layer
            id={`privacy-area-${user.id}`}
            type="circle"
            paint={{
              'circle-radius': ['/', ['get', 'radius'], ['cos', ['*', ['get', 'lat'], 0.0174533]]],
              'circle-color': isOnline ? '#22c55e' : '#71717a',
              'circle-opacity': 0.1,
              'circle-stroke-width': 1,
              'circle-stroke-color': isOnline ? '#22c55e' : '#71717a',
              'circle-stroke-opacity': 0.3
            }}
          />
        </Source>
      )}

      <Marker
        longitude={user.current_location.longitude}
        latitude={user.current_location.latitude}
        anchor="center"
        onClick={() => setShowPresence(true)}
      >
        <div className="relative cursor-pointer group">
          {/* Pulsing effect for online users */}
          {isOnline && (
            <motion.div
              as="div"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '9999px',
                backgroundColor: 'rgba(34, 197, 94, 0.3)'
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.3, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}

          {/* User avatar */}
          <div className={cn(
            'w-10 h-10 rounded-full border-2',
            user.presence_status === 'online' ? 'border-success' :
            user.presence_status === 'away' ? 'border-warning' : 'border-default'
          )}>
            <Avatar
              src={user.avatar_url ?? undefined}
              name={user.full_name ?? 'User'}
              className="w-full h-full"
            />
          </div>

          {/* Location Sharing Indicator */}
          {user.location_sharing !== 'public' && (
            <div className="absolute -top-2 -left-2">
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                "bg-background/80 backdrop-blur-md border border-default-200"
              )}>
                <span className="text-xs">🔒</span>
              </div>
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <span className="font-medium">
                  {user.full_name || 'Anonymous User'}
                </span>
                <span className="text-tiny text-default-500">
                  •
                </span>
                <span className="text-tiny text-default-500">
                  {distance < 0.1 
                    ? 'Nearby'
                    : `${distance.toFixed(1)} mi away`}
                </span>
              </div>
              {!isOnline && user.last_seen_at && (
                <div className="text-tiny text-default-400 mt-1">
                  Last seen {formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })}
                </div>
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1">
              <div className="border-8 border-transparent border-t-background/80" />
            </div>
          </div>
        </div>
      </Marker>

      {/* Presence Modal */}
      {showPresence && (
        <Modal isOpen={showPresence} onClose={() => setShowPresence(false)}>
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-2">
                <Avatar src={user.avatar_url ?? undefined} name={user.full_name ?? 'User'} />
                <div>
                  <h3 className="text-lg font-semibold">{user.full_name || 'Anonymous User'}</h3>
                  <p className="text-sm text-gray-500">
                    {isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })}`}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4 pb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Location</h4>
                  <p>{distance < 0.1 ? 'Nearby' : `${distance.toFixed(1)} miles away`}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Privacy Level</h4>
                  <p className="capitalize">{user.location_sharing || 'Not specified'}</p>
                </div>
                {user.location_accuracy !== null && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Location Accuracy</h4>
                    <p>Within {user.location_accuracy} meters</p>
                  </div>
                )}
              </div>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
