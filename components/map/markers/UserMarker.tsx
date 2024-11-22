import { Avatar, Chip, Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { MapPin } from './MapPin'; // Assuming MapPin is a custom component
import { AdvancedPresence } from './AdvancedPresence'; // Assuming AdvancedPresence is a custom component
import { Source, Layer } from 'react-map-gl'; // Assuming react-map-gl is installed
import { Tooltip } from './Tooltip'; // Assuming Tooltip is a custom component
import { Shield } from './Shield'; // Assuming Shield is a custom component
import cn from 'classnames'; // Assuming classnames is installed

interface UserMarkerProps {
  user: {
    id: string;
    status: 'online' | 'away' | 'offline';
    lastSeen: Date;
    activity?: string;
    mood?: string;
    active_zone?: string;
    profile: {
      avatar_url?: string;
      full_name?: string;
    };
    location: {
      latitude: number;
      longitude: number;
    };
    accuracy_meters?: number;
    privacy_level?: 'precise' | 'approximate' | 'area';
  };
  onClick: () => void;
  distance: number;
  longitude: number;
  latitude: number;
}

export function UserMarker({ user, onClick, distance, longitude, latitude }: UserMarkerProps) {
  const isOnline = user.status === 'online';
  const [showPresence, setShowPresence] = useState(false);

  return (
    <>
      {/* Privacy Radius Circle */}
      {user.privacy_level !== 'precise' && user.accuracy_meters && (
        <Source
          id={`privacy-area-${user.id}`}
          type="geojson"
          data={{
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            properties: {}
          }}
        >
          <Layer
            id={`privacy-area-${user.id}`}
            type="circle"
            paint={{
              'circle-radius': ['/', ['get', 'radius'], ['cos', ['*', ['get', 'lat'], 0.0174533]]],
              'circle-color': user.status === 'online' ? '#22c55e' : '#71717a',
              'circle-opacity': 0.1,
              'circle-stroke-width': 1,
              'circle-stroke-color': user.status === 'online' ? '#22c55e' : '#71717a',
              'circle-stroke-opacity': 0.3
            }}
            properties={{
              radius: user.accuracy_meters,
              lat: latitude
            }}
          />
        </Source>
      )}

      <div
        className="relative cursor-pointer group"
        onClick={() => setShowPresence(true)}
      >
        {/* Pulsing effect for online users */}
        {isOnline && (
          <motion.div
            className="absolute inset-0 rounded-full bg-success/30"
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
        <div className={`
          w-10 h-10 rounded-full border-2
          ${user.status === 'online' ? 'border-success' :
          user.status === 'away' ? 'border-warning' : 'border-default'}
        `}>
          <Avatar
            src={user.profile.avatar_url || undefined}
            name={user.profile.full_name || 'User'}
            className="w-full h-full"
          />
        </div>

        {/* Mood Indicator */}
        {user.mood && (
          <div className="absolute -top-2 -right-2">
            <Chip size="sm" variant="shadow" className="h-6">
              {user.mood}
            </Chip>
          </div>
        )}

        {/* Activity Zone Indicator */}
        {user.active_zone && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
            <Chip 
              size="sm" 
              variant="flat" 
              startContent={<MapPin className="w-3 h-3" />}
            >
              {user.active_zone}
            </Chip>
          </div>
        )}

        {/* Privacy Level Indicator */}
        {user.privacy_level !== 'precise' && (
          <div className="absolute -top-2 -left-2">
            <Tooltip content={`Location accuracy: Within ${user.accuracy_meters}m`}>
              <div className={cn(
                "w-4 h-4 rounded-full flex items-center justify-center",
                "bg-background/80 backdrop-blur-md border border-default-200"
              )}>
                <Shield className="w-3 h-3 text-default-400" />
              </div>
            </Tooltip>
          </div>
        )}

        {/* Tooltip */}
        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-background/80 backdrop-blur-md rounded-lg px-3 py-2 shadow-lg">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="font-medium">
                {user.activity || 'Exploring'}
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
            {!isOnline && (
              <div className="text-tiny text-default-400 mt-1">
                Last seen {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
              </div>
            )}
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-full -mt-1">
            <div className="border-8 border-transparent border-t-background/80" />
          </div>
        </div>
      </div>

      {/* Advanced Presence Modal */}
      <Modal 
        isOpen={showPresence} 
        onClose={() => setShowPresence(false)}
        size="lg"
      >
        <ModalContent>
          <ModalHeader>User Presence</ModalHeader>
          <ModalBody>
            <AdvancedPresence userId={user.id} />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
