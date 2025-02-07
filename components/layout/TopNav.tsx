import { useState } from 'react';
import { User, Coordinates, VisitingLocation } from '@/types/core';
import { Avatar, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { MapPin, Navigation, Search, Bell, Filter } from 'lucide-react';
import { SearchOverlay } from '../search/SearchOverlay';

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
        <Button
          variant="light"
          className="h-auto py-1.5 px-3"
          startContent={<Navigation className="w-4 h-4 text-primary" />}
        >
          <span className="text-sm">
            {visitingLocation.city?.name || `${visitingLocation.radius}mi radius`}
          </span>
        </Button>
      );
    }

    return currentLocation ? (
      <Button
        variant="light"
        className="h-auto py-1.5 px-3"
        startContent={<MapPin className="w-4 h-4" />}
      >
        <span className="text-sm">Current Location</span>
      </Button>
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
    <>
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

            {renderTitle() && (
              <h1 className="text-lg font-semibold">
                {renderTitle()}
              </h1>
            )}
          </div>

          {/* Center Section */}
          {renderLocationInfo()}

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {view === 'map' && (
              <>
                <Button
                  isIconOnly
                  variant="light"
                  onPress={() => setIsSearching(true)}
                >
                  <Search className="w-5 h-5" />
                </Button>
                <Button
                  isIconOnly
                  variant="light"
                >
                  <Filter className="w-5 h-5" />
                </Button>
              </>
            )}
            
            <Button
              isIconOnly
              variant="light"
              className="relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
          </div>
        </div>
      </header>

      <SearchOverlay
        isOpen={isSearching}
        onClose={() => setIsSearching(false)}
        currentLocation={currentLocation}
      />
    </>
  );
}
