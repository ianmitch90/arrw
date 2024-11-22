import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
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

type PrivacyLevel = 'precise' | 'approximate' | 'area';

interface LocationPrivacySettings {
  privacyLevel: PrivacyLevel;
  obscuringRadius: number;
  sharingEnabled: boolean;
}

export function LocationPrivacyControl() {
  const supabase = useSupabaseClient<Database>();
  const user = useUser();
  const [settings, setSettings] = useState<LocationPrivacySettings>({
    privacyLevel: 'precise',
    obscuringRadius: 100,
    sharingEnabled: true,
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
      .select('location_privacy_level, location_obscuring_radius, location_sharing_enabled')
      .eq('id', user!.id)
      .single();

    if (data && !error) {
      setSettings({
        privacyLevel: data.location_privacy_level as PrivacyLevel,
        obscuringRadius: data.location_obscuring_radius || 100,
        sharingEnabled: data.location_sharing_enabled,
      });
    }
  };

  const updatePrivacyLevel = async (level: PrivacyLevel) => {
    const { error } = await supabase.rpc('update_location_privacy', {
      p_privacy_level: level,
      p_obscuring_radius: settings.obscuringRadius,
    });

    if (!error) {
      setSettings(prev => ({ ...prev, privacyLevel: level }));
    }
  };

  const updateRadius = async (radius: number) => {
    const { error } = await supabase.rpc('update_location_privacy', {
      p_privacy_level: settings.privacyLevel,
      p_obscuring_radius: radius,
    });

    if (!error) {
      setSettings(prev => ({ ...prev, obscuringRadius: radius }));
    }
  };

  const toggleSharing = async () => {
    const { error } = await supabase.rpc('toggle_location_sharing', {
      p_enabled: !settings.sharingEnabled,
    });

    if (!error) {
      setSettings(prev => ({ ...prev, sharingEnabled: !prev.sharingEnabled }));
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
              onClick={toggleSharing}
              className={settings.sharingEnabled ? 'text-success' : 'text-danger'}
            >
              {settings.sharingEnabled ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </Button>
          </CardHeader>
          <CardBody className="gap-4">
            <RadioGroup
              value={settings.privacyLevel}
              onValueChange={val => updatePrivacyLevel(val as PrivacyLevel)}
            >
              <Radio value="precise">
                Precise Location
                <span className="text-tiny text-default-400 ml-1">
                  (Exact location)
                </span>
              </Radio>
              <Radio value="approximate">
                Approximate Location
                <span className="text-tiny text-default-400 ml-1">
                  (Within {settings.obscuringRadius}m)
                </span>
              </Radio>
              <Radio value="area">
                General Area
                <span className="text-tiny text-default-400 ml-1">
                  (Within {settings.obscuringRadius * 2}m)
                </span>
              </Radio>
            </RadioGroup>

            {settings.privacyLevel !== 'precise' && (
              <div className="space-y-2">
                <label className="text-small">
                  Privacy Radius: {settings.obscuringRadius}m
                </label>
                <Slider
                  size="sm"
                  step={50}
                  minValue={50}
                  maxValue={500}
                  value={settings.obscuringRadius}
                  onChange={val => updateRadius(val as number)}
                  className="max-w-md"
                />
              </div>
            )}

            <p className="text-tiny text-default-400">
              {settings.privacyLevel === 'precise'
                ? 'Others will see your exact location'
                : settings.privacyLevel === 'approximate'
                ? `Your location will be randomized within ${settings.obscuringRadius}m of your actual position`
                : `Your location will be randomized within ${
                    settings.obscuringRadius * 2
                  }m of your actual position`}
            </p>
          </CardBody>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
