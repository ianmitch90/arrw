import { Button } from '@heroui/react';
import { MapPin, Plane } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

export function TravelModeToggle() {
  const { state, enableTravelMode } = useLocation();

  return (
    <Button
      color={state.travelMode ? 'secondary' : 'primary'}
      variant="flat"
      startContent={state.travelMode ? <Plane /> : <MapPin />}
      onPress={() => enableTravelMode(!state.travelMode)}
    >
      {state.travelMode ? 'Exit Travel Mode' : 'Enter Travel Mode'}
    </Button>
  );
}
