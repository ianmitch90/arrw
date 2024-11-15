import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Slider, Switch, Chip } from '@nextui-org/react';
import { MapPin, Building2, CalendarDays } from 'lucide-react';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    placeTypes: string[];
    radius: number;
    showStories: boolean;
    showPlaces: boolean;
  };
  onChange: (filters: {
    placeTypes: string[];
    radius: number;
    showStories: boolean;
    showPlaces: boolean;
  }) => void;
}

export function FilterPanel({ isOpen, onClose, filters, onChange }: FilterPanelProps) {
  const placeTypes = [
    { key: 'poi', label: 'Points of Interest', icon: MapPin },
    { key: 'event_venue', label: 'Event Venues', icon: Building2 },
    { key: 'user_created', label: 'User Places', icon: CalendarDays }
  ];

  const handlePlaceTypeToggle = (type: string) => {
    const newTypes = filters.placeTypes.includes(type)
      ? filters.placeTypes.filter(t => t !== type)
      : [...filters.placeTypes, type];
    
    onChange({
      ...filters,
      placeTypes: newTypes
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="bottom-center"
      classNames={{
        base: 'rounded-t-lg rounded-b-none m-0',
        wrapper: 'items-end'
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Map Filters
            </ModalHeader>
            <ModalBody className="gap-6">
              {/* Content Types */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Content</h3>
                <div className="flex flex-col gap-2">
                  <Switch
                    isSelected={filters.showStories}
                    onValueChange={(value) => onChange({ ...filters, showStories: value })}
                  >
                    Show Stories
                  </Switch>
                  <Switch
                    isSelected={filters.showPlaces}
                    onValueChange={(value) => onChange({ ...filters, showPlaces: value })}
                  >
                    Show Places
                  </Switch>
                </div>
              </div>

              {/* Place Types */}
              {filters.showPlaces && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Place Types</h3>
                  <div className="flex flex-wrap gap-2">
                    {placeTypes.map(({ key, label, icon: Icon }) => (
                      <Chip
                        key={key}
                        variant="flat"
                        startContent={<Icon className="w-4 h-4" />}
                        className="cursor-pointer"
                        color={filters.placeTypes.includes(key) ? 'primary' : 'default'}
                        onClick={() => handlePlaceTypeToggle(key)}
                      >
                        {label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}

              {/* Radius Slider */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Search Radius</h3>
                <Slider
                  size="sm"
                  step={1}
                  minValue={1}
                  maxValue={50}
                  value={filters.radius}
                  onChange={(value) => onChange({ ...filters, radius: value as number })}
                  className="max-w-md"
                  marks={[
                    { value: 1, label: '1mi' },
                    { value: 10, label: '10mi' },
                    { value: 25, label: '25mi' },
                    { value: 50, label: '50mi' }
                  ]}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="primary"
                onPress={onClose}
              >
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
