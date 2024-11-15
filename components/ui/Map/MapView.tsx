import { Avatar, AvatarGroup, Button, Chip } from '@nextui-org/react';
import { Filter, MapPin } from 'lucide-react';
import { useCallback } from 'react';

interface MapViewProps {
  onUserSelect?: (userId: string) => void;
  onPlaceSelect?: (placeId: string) => void;
}

export function MapView({ onUserSelect, onPlaceSelect }: MapViewProps) {
  const users = [
    { id: '1', name: 'You', avatar: '/avatars/you.png', isOnline: true },
    { id: '2', name: 'Jorley', avatar: '/avatars/jorley.png', isOnline: true },
    { id: '3', name: 'Gergio', avatar: '/avatars/gergio.png', isOnline: true },
    { id: '4', name: 'Minny', avatar: '/avatars/minny.png', isOnline: true },
    { id: '5', name: 'Nebby', avatar: '/avatars/nebby.png', isOnline: true }
  ];

  const handleViewModeChange = useCallback((mode: 'community' | 'places') => {
    // Handle view mode change
  }, []);

  return (
    <div className="relative flex flex-col h-screen bg-background">
      {/* Top Section */}
      <div className="absolute top-0 w-full p-4 z-10 space-y-4">
        {/* Location and Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} />
            <span>Florida, United States</span>
            <span className="text-gray-400 text-xs">(within 10 miles)</span>
          </div>
          <Button
            isIconOnly
            variant="flat"
            color="primary"
            size="sm"
            aria-label="Filter"
          >
            <Filter size={16} />
          </Button>
        </div>

        {/* User Stories */}
        <div className="flex gap-3 overflow-x-auto py-2">
          {users.map((user) => (
            <div key={user.id} className="flex flex-col items-center gap-1">
              <Avatar
                isBordered={user.isOnline}
                color="primary"
                src={user.avatar}
                size="lg"
                className="cursor-pointer"
              />
              <span className="text-xs">{user.name}</span>
            </div>
          ))}
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <Button
            color="primary"
            variant="flat"
            size="sm"
            className="flex-1"
            onClick={() => handleViewModeChange('community')}
          >
            Community
          </Button>
          <Button
            color="default"
            variant="light"
            size="sm"
            className="flex-1"
            onClick={() => handleViewModeChange('places')}
          >
            Places
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto py-1">
          <Chip size="sm" variant="flat">
            Hotel
          </Chip>
          <Chip size="sm" variant="solid" color="primary">
            Party
          </Chip>
          <Chip size="sm" variant="flat">
            Health
          </Chip>
          <Chip size="sm" variant="flat">
            Beach
          </Chip>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 w-full">
        {/* Map implementation will go here */}
      </div>

      {/* Bottom Navigation */}
      <div className="absolute bottom-0 w-full bg-background/80 backdrop-blur-md">
        <div className="flex justify-around items-center p-4 max-w-md mx-auto">
          <Button isIconOnly variant="light" className="text-default-500">
            <UserIcon />
          </Button>
          <Button isIconOnly variant="light" className="text-primary">
            <MapIcon />
          </Button>
          <Button isIconOnly variant="light" className="text-default-500">
            <ChatIcon />
          </Button>
          <Button isIconOnly variant="light" className="text-default-500">
            <LockIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icons (we can replace these with proper icons from your icon library)
const UserIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MapIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ChatIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
