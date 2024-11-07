import { Switch, Card, CardBody } from '@nextui-org/react';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';

export function LocationPrivacySettings() {
  const { state } = useLocation();

  const updatePrivacySettings = async (setting: string, value: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({
        privacy_settings: {
          ...state.privacySettings,
          [setting]: value
        }
      })
      .eq('id', (await supabase.auth.getUser()).data.user?.id);

    if (error) throw error;
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          <Switch
            defaultSelected={state.privacySettings?.shareLocation}
            onValueChange={(value) =>
              updatePrivacySettings('shareLocation', value)
            }
          >
            Share my location
          </Switch>

          <Switch
            defaultSelected={state.privacySettings?.showDistance}
            onValueChange={(value) =>
              updatePrivacySettings('showDistance', value)
            }
          >
            Show distance to others
          </Switch>

          <Switch
            defaultSelected={state.privacySettings?.allowLocationHistory}
            onValueChange={(value) =>
              updatePrivacySettings('allowLocationHistory', value)
            }
          >
            Save location history
          </Switch>
        </div>
      </CardBody>
    </Card>
  );
}
