import { useState } from 'react';
import { User, Coordinates, VisitingLocation } from '@/types/core';
import { Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { MapPin, Navigation, Search, Settings } from 'lucide-react';

interface TopNavProps {
  currentUser: User;
  currentLocation?: Coordinates;
  visitingLocation?: VisitingLocation;
  view: 'map' | 'account' | 'chat' | 'global';
  onLocationChange: (coords: Coordinates, isVisiting?: boolean) => void;
}

export function TopNav({
  currentUser,
  currentLocation,
  visitingLocation,
  view,
  onLocationChange
}: TopNavProps) {
  const [isSearching, setIsSearching] = useState(false);

  const renderLocationInfo = () => {
    if (view !== 'map') return null;

    if (visitingLocation) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full">
          <Navigation className="w-4 h-4 text-primary" />
          <span className="text-sm">
            Visiting {visitingLocation.city?.name || `${visitingLocation.radius}mi radius`}
          </span>
        </div>
      );
    }

    return currentLocation ? (
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        <span className="text-sm">Current Location</span>
      </div>
    ) : null;
  };

  const renderTitle = () => {
    switch (view) {
      case 'account':
        return 'Profile';
      case 'chat':
        return 'Messages';
      case 'global':
        return visitingLocation?.city?.name || 'Local Chat';
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Dropdown placement="bottom-start">
            <DropdownTrigger>
              <Avatar
                src={currentUser.avatarUrl}
                name={currentUser.displayName}
                size="sm"
                className="cursor-pointer"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem key="profile">View Profile</DropdownItem>
              <DropdownItem key="settings">Settings</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>

          <h1 className="text-lg font-semibold">
            {renderTitle()}
          </h1>
        </div>

        {/* Center Section */}
        {renderLocationInfo()}

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {view === 'map' && (
            <Button
              isIconOnly
              variant="light"
              onPress={() => setIsSearching(true)}
            >
              <Search className="w-5 h-5" />
            </Button>
          )}
          
          <Button
            isIconOnly
            variant="light"
            onPress={() => {/* TODO: Open settings */}}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
