import { PlaceCardProps } from '@/types/map';
import { Button, Avatar, Image } from '@nextui-org/react';
import { MapPin, X, Calendar, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function PlaceCard({ place, onClose, className }: PlaceCardProps) {
  const timeAgo = place.created_at 
    ? formatDistanceToNow(new Date(place.created_at), { addSuffix: true })
    : 'recently';

  const renderPlaceTypeIcon = () => {
    switch (place.place_type) {
      case 'poi':
        return <MapPin className="w-5 h-5" />;
      case 'event_venue':
        return <Calendar className="w-5 h-5" />;
      case 'user_created':
        return <User className="w-5 h-5" />;
      default:
        return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            {renderPlaceTypeIcon()}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{place.name}</h3>
            <p className="text-sm text-default-500">
              Added {timeAgo}
            </p>
          </div>
        </div>
        <Button
          isIconOnly
          variant="light"
          onPress={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {place.description && (
        <p className="text-sm">{place.description}</p>
      )}

      {place.photo_url && (
        <Image
          src={place.photo_url}
          alt={place.name}
          width={400}
          height={300}
          className="w-full h-48 object-cover rounded-lg"
        />
      )}

      {place.created_by && place.creator && (
        <div className="flex items-center gap-2 pt-2 border-t">
          <Avatar
            size="sm"
            src={place.creator.avatar_url}
            name={place.creator.full_name}
          />
          <span className="text-sm">
            Added by {place.creator.full_name}
          </span>
        </div>
      )}
    </div>
  );
}
