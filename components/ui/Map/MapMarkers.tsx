import { Avatar } from '@nextui-org/react';
import { Place, User } from '@/utils/api/data-service';

interface MarkerProps {
  type: 'user' | 'place';
  data: User | Place;
  onClick?: () => void;
}

export function MapMarker({ type, data, onClick }: MarkerProps) {
  if (type === 'user') {
    return (
      <div
        className="cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
        onClick={onClick}
      >
        <Avatar
          isBordered
          color="primary"
          src={(data as User).avatar}
          className="w-8 h-8"
        />
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer bg-primary text-white rounded-full p-2 transform -translate-x-1/2 -translate-y-1/2"
      onClick={onClick}
    >
      <div className="w-4 h-4" />
    </div>
  );
}
