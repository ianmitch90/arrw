import { Avatar, Button, Chip, Skeleton } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { useNearbyUsers } from '@/hooks/useNearbyUsers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { Database } from '@/types/database.types';
import { LngLat } from 'mapbox-gl';
import { useToast } from '@/hooks/useToast';
import { AvatarSkeleton } from '@/components/Skeletons';

const MAX_LOCATION_RETRIES = 3;
const RETRY_DELAY = 2000;

export function TopBar() {
  const [currentLocation, setCurrentLocation] = useState<LngLat | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const { nearbyUsers, loading: loadingNearby } =
    useNearbyUsers(currentLocation);
  const [currentUser, setCurrentUser] = useState<
    Database['public']['Tables']['profiles']['Row'] | null
  >(null);
  const supabase = createClientComponentClient<Database>();
  const { showToast } = useToast();

  const getLocation = async (retryCount = 0) => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        }
      );

      setCurrentLocation(
        new LngLat(position.coords.longitude, position.coords.latitude)
      );
      setLocationError(null);
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(
        error instanceof Error ? error.message : 'Location error'
      );

      if (retryCount < MAX_LOCATION_RETRIES) {
        showToast('Retrying to get location...', 'info');
        setTimeout(
          () => {
            getLocation(retryCount + 1);
          },
          RETRY_DELAY * Math.pow(2, retryCount)
        );
      } else {
        showToast('Failed to get location', 'error', {
          action: {
            label: 'Retry',
            onClick: () => getLocation(0)
          }
        });
      }
    }
  };

  const getCurrentUser = async () => {
    try {
      setLoadingProfile(true);
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (profile) setCurrentUser(profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      showToast('Failed to load profile', 'error', {
        action: {
          label: 'Retry',
          onClick: getCurrentUser
        }
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    getLocation();
    getCurrentUser();
  }, []);

  return (
    <div className="fixed top-0 w-full px-4 py-2 bg-background/80 backdrop-blur-md z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {loadingProfile ? (
            <Skeleton className="h-5 w-32 rounded" />
          ) : (
            <span className="text-default-600">
              {currentUser?.city || 'Location unavailable'}
              {locationError && (
                <Icon
                  icon="lucide:alert-circle"
                  className="inline ml-1 text-danger"
                  onClick={() => getLocation(0)}
                />
              )}
            </span>
          )}
          <Icon icon="lucide:map-pin" className="text-default-400" />
        </div>

        <Button
          size="sm"
          variant="flat"
          color="danger"
          startContent={<Icon icon="lucide:filter" />}
          className="bg-danger/10"
        >
          Filter
        </Button>
      </div>

      <div className="flex items-center gap-2 mt-2 overflow-x-auto hide-scrollbar">
        {loadingProfile ? (
          <AvatarSkeleton />
        ) : (
          currentUser && (
            <Avatar
              size="sm"
              src={currentUser.avatar_url || ''}
              className="cursor-pointer min-w-[32px]"
              isBordered
              color="primary"
            />
          )
        )}
        <div className="flex gap-2">
          {loadingNearby
            ? // Show 5 skeleton avatars while loading
              Array.from({ length: 5 }).map((_, i) => (
                <AvatarSkeleton key={`skeleton-${i}`} />
              ))
            : nearbyUsers.map((user) => (
                <Avatar
                  key={user.id}
                  size="sm"
                  src={user.avatar_url || ''}
                  className="cursor-pointer min-w-[32px]"
                  isBordered={user.is_online}
                  color={user.is_online ? 'success' : 'default'}
                />
              ))}
        </div>
        <Chip color="danger" variant="flat" className="ml-2 bg-danger/10">
          Community
        </Chip>
      </div>
    </div>
  );
}
