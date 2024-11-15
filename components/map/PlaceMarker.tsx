import { Place } from '@/types/core';
import { MapPin, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceMarkerProps {
  place: Place;
  onClick: () => void;
  isSelected?: boolean;
}

export function PlaceMarker({ place, onClick, isSelected }: PlaceMarkerProps) {
  const renderIcon = () => {
    switch (place.place_type) {
      case 'poi':
        return <MapPin className="w-5 h-5" />;
      case 'event_venue':
        return <Calendar className="w-5 h-5" />;
      case 'user_created':
        return <User className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div
      className="relative cursor-pointer group"
      onClick={onClick}
    >
      {/* Marker Container */}
      <div
        className={cn(
          'p-2 rounded-full transition-colors',
          isSelected
            ? 'bg-primary text-primary-foreground'
            : 'bg-background text-foreground hover:bg-primary hover:text-primary-foreground',
          'shadow-lg'
        )}
      >
        {renderIcon()}
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-background/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
          <p className="text-sm font-medium">
            {place.name}
          </p>
          {place.description && (
            <p className="text-xs text-default-500 max-w-[200px] truncate">
              {place.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
