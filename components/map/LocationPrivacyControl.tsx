import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types_db';
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  RadioGroup,
  Radio,
  Slider,
  Card,
  CardBody,
  CardHeader,
} from '@nextui-org/react';
import { Eye, EyeOff, Shield } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationSharing = Profile['location_sharing'];

const LOCATION_SHARING_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'friends', label: 'Friends Only' },
  { value: 'friends_of_friends', label: 'Friends of Friends' },
  { value: 'private', label: 'Private' },
] as const;

interface LocationPrivacySettings {
  locationSharing: LocationSharing;
  locationAccuracy: number | null;
}

export function LocationPrivacyControl() {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [settings, setSettings] = useState<LocationPrivacySettings>({
    locationSharing: 'private',
    locationAccuracy: 100,
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPrivacySettings();
    }
  }, [user]);

  const fetchPrivacySettings = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('location_sharing, location_accuracy')
      .eq('id', user!.id)
      .single();

    if (data && !error) {
      setSettings({
        locationSharing: data.location_sharing,
        locationAccuracy: data.location_accuracy,
      });
    }
  };

  const updateLocationSharing = async (sharing: LocationSharing) => {
    const { error } = await supabase
      .from('profiles')
      .update({ location_sharing: sharing })
      .eq('id', user!.id);

    if (!error) {
      setSettings(prev => ({ ...prev, locationSharing: sharing }));
    }
  };

  const updateLocationAccuracy = async (accuracy: number | null) => {
    const { error } = await supabase
      .from('profiles')
      .update({ location_accuracy: accuracy })
      .eq('id', user!.id);

    if (!error) {
      setSettings(prev => ({ ...prev, locationAccuracy: accuracy }));
    }
  };

  const toggleLocationSharing = () => {
    const newSharing = settings.locationSharing === 'public' ? 'private' : 'public';
    updateLocationSharing(newSharing);
  };

  const handleSharingChange = (value: string) => {
    const newSharing = value as LocationSharing;
    if (LOCATION_SHARING_OPTIONS.some(opt => opt.value === newSharing)) {
      updateLocationSharing(newSharing);
    }
  };

  return (
    <Popover isOpen={isOpen} onOpenChange={setIsOpen} placement="bottom-end">
      <PopoverTrigger>
        <Button
          isIconOnly
          variant="light"
          className="bg-background/60 backdrop-blur-md"
        >
          <Shield className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Card>
          <CardHeader className="flex justify-between items-center">
            <h4 className="text-medium font-medium">Location Privacy</h4>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={toggleLocationSharing}
              className={settings.locationSharing === 'public' ? 'text-success' : 'text-danger'}
            >
              {settings.locationSharing === 'public' ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </CardHeader>
          <CardBody className="gap-4">
            <div>
              <label className="text-sm mb-2 block">Location Sharing</label>
              <RadioGroup
                value={settings.locationSharing || 'private'}
                onValueChange={handleSharingChange}
              >
                {LOCATION_SHARING_OPTIONS.map(option => (
                  <Radio key={option.value} value={option.value}>
                    {option.label}
                  </Radio>
                ))}
              </RadioGroup>
            </div>
            <div>
              <label className="text-sm mb-2 block">Location Accuracy</label>
              <Slider
                size="sm"
                step={10}
                maxValue={100}
                minValue={0}
                value={settings.locationAccuracy || 0}
                onChange={(value) => updateLocationAccuracy(value as number)}
                className="max-w-md"
              />
            </div>
          </CardBody>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
