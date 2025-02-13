import { Card, CardBody, CardHeader, Button, Image } from '@heroui/react';
import { MapPin, Clock, Users } from 'lucide-react';

interface PlaceDetailsProps {
  name: string;
  address: string;
  hours: string;
  distance: string;
  attendees: number;
  imageUrl: string;
  onClose?: () => void;
}

export function PlaceDetailsCard({
  name,
  address,
  hours,
  distance,
  attendees,
  imageUrl,
  onClose
}: PlaceDetailsProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="relative p-0">
        <Image
          removeWrapper
          alt={name}
          className="z-0 w-full h-[140px] object-cover"
          src={imageUrl}
        />
        <Button
          isIconOnly
          className="absolute top-2 right-2"
          size="sm"
          variant="light"
          onPress={onClose}
        >
          ×
        </Button>
      </CardHeader>
      <CardBody className="px-4 py-3">
        <div className="flex justify-between items-start mb-2">
          <h4 className="text-large font-bold">{name}</h4>
          <span className="text-small text-default-500">{distance}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-small text-default-500">
            <MapPin size={16} />
            <span>{address}</span>
          </div>
          <div className="flex items-center gap-2 text-small text-default-500">
            <Clock size={16} />
            <span>{hours}</span>
          </div>
          <div className="flex items-center gap-2 text-small text-default-500">
            <Users size={16} />
            <span>{attendees} people here</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
