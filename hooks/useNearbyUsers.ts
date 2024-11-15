import { useEffect, useRef, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { LngLat } from 'mapbox-gl';
import { debounce } from 'lodash';
import { useToast } from '@/hooks/useToast';
import { usePresence } from '@/hooks/usePresence';
import { useLocationCache } from '@/hooks/useLocationCache';

const MILES_TO_METERS = 1609.34;
const DEFAULT_RADIUS_MILES = 5;
const QUERY_DEBOUNCE_MS = 500;
const MAX_RESULTS = 50;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const CLEANUP_INTERVAL = 60000; // 1 minute
const LOCATION_STALE_THRESHOLD = 300000; // 5 minutes
const PRESENCE_TIMEOUT = 180000; // 3 minutes

type Profile = Database['public']['Tables']['profiles']['Row'];

interface NearbyUsersOptions {
  onlineOnly?: boolean;
  maxAge?: number; // How old can a location update be before considered stale
}

export function useNearbyUsers(
  center: LngLat | null,
  radiusMiles: number = DEFAULT_RADIUS_MILES,
  options: NearbyUsersOptions = {}
) {
  const [nearbyUsers, setNearbyUsers] = useState<Map<string, Profile>>(
    new Map()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClientComponentClient<Database>();
  const lastQuery = useRef<string | null>(null);
  const { showToast } = useToast();
  const cleanupInterval = useRef<NodeJS.Timeout>();
  const presenceChannel = useRef<ReturnType<typeof supabase.channel>>();
  const { status: userStatus } = usePresence();
  const { isLocationCached, getCachedUsers, cacheLocation } =
    useLocationCache();

  // Keep track of user presence
  const userPresence = useRef<Map<string, number>>(new Map());

  const isUserOnline = (userId: string) => {
    const lastSeen = userPresence.current.get(userId);
    return lastSeen && Date.now() - lastSeen < PRESENCE_TIMEOUT;
  };

  const cleanupStaleUsers = useCallback(() => {
    const now = Date.now();
    setNearbyUsers((current) => {
      const updated = new Map(current);
      for (const [userId, user] of updated) {
        const locationAge = now - new Date(user.location_updated_at).getTime();
        const isStale =
          locationAge > (options.maxAge || LOCATION_STALE_THRESHOLD);
        const isOffline = options.onlineOnly && !isUserOnline(userId);

        if (isStale || isOffline) {
          updated.delete(userId);
        }
      }
      return updated;
    });
  }, [options.onlineOnly, options.maxAge]);

  // Set up presence tracking
  useEffect(() => {
    if (nearbyUsers.size === 0) return;

    const userIds = Array.from(nearbyUsers.keys());

    presenceChannel.current = supabase
      .channel('online-users')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.current?.presenceState() || {};
        const now = Date.now();

        // Update presence timestamps
        Object.keys(state).forEach((userId) => {
          if (userIds.includes(userId)) {
            userPresence.current.set(userId, now);
          }
        });

        // If onlineOnly is enabled, update visible users
        if (options.onlineOnly) {
          cleanupStaleUsers();
        }
      })
      .subscribe();

    return () => {
      presenceChannel.current?.unsubscribe();
    };
  }, [nearbyUsers.size, options.onlineOnly]);

  // Periodic cleanup and refresh
  useEffect(() => {
    cleanupInterval.current = setInterval(() => {
      cleanupStaleUsers();

      // If we have a center, refresh the current viewport
      if (center) {
        const radiusMeters = radiusMiles * MILES_TO_METERS;
        fetchNearbyUsers(center, radiusMeters);
      }
    }, CLEANUP_INTERVAL);

    return () => {
      if (cleanupInterval.current) {
        clearInterval(cleanupInterval.current);
      }
    };
  }, [center, radiusMiles, options.onlineOnly]);

  const fetchNearbyUsers = async (
    center: LngLat,
    radiusMeters: number,
    retryCount = 0
  ) => {
    // Check cache first
    if (isLocationCached(center, radiusMeters)) {
      const cachedUsers = getCachedUsers(center, radiusMeters);
      setNearbyUsers(new Map(cachedUsers.map((user) => [user.id, user])));
      return;
    }

    const point = `POINT(${center.lng} ${center.lat})`;

    // Skip if same query and not a refresh
    const queryKey = `${point}-${radiusMeters}-${options.onlineOnly}`;
    if (queryKey === lastQuery.current && retryCount === 0) return;
    lastQuery.current = queryKey;

    setLoading(true);
    setError(null);

    try {
      let query = supabase.rpc('get_nearby_users', {
        user_location: point,
        radius_meters: radiusMeters,
        max_results: MAX_RESULTS
      });

      // Add online-only filter if needed
      if (options.onlineOnly) {
        const onlineThreshold = new Date(
          Date.now() - PRESENCE_TIMEOUT
        ).toISOString();
        query = query.gt('last_seen', onlineThreshold);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        // Cache the results
        cacheLocation(center, radiusMeters, data);

        setNearbyUsers((current) => {
          const updated = new Map(current);
          data.forEach((user) => {
            if (!options.onlineOnly || isUserOnline(user.id)) {
              updated.set(user.id, user);
            }
          });
          return updated;
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error('Error fetching nearby users:', error);

      if (retryCount < MAX_RETRIES) {
        showToast('Retrying to fetch nearby users...', 'info');
        setTimeout(
          () => {
            fetchNearbyUsers(center, radiusMeters, retryCount + 1);
          },
          RETRY_DELAY * Math.pow(2, retryCount)
        );
      } else {
        setError(error);
        showToast('Failed to fetch nearby users', 'error', {
          action: {
            label: 'Retry',
            onClick: () => fetchNearbyUsers(center, radiusMeters, 0)
          }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const debouncedFetch = debounce(fetchNearbyUsers, QUERY_DEBOUNCE_MS);

  // Set up real-time subscription for all loaded users
  useEffect(() => {
    if (nearbyUsers.size === 0) return;

    const userIds = Array.from(nearbyUsers.keys());

    const channel = supabase
      .channel('nearby_users_location')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=in.(${userIds.join(',')})`
        },
        (payload) => {
          setNearbyUsers((current) => {
            const updated = new Map(current);
            updated.set(payload.new.id, payload.new as Profile);
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [nearbyUsers.size]);

  // Fetch users when viewport changes
  useEffect(() => {
    if (!center) return;

    const radiusMeters = radiusMiles * MILES_TO_METERS;
    debouncedFetch(center, radiusMeters);

    return () => {
      debouncedFetch.cancel();
    };
  }, [center, radiusMiles]);

  return {
    nearbyUsers: Array.from(nearbyUsers.values()).filter(
      (user) => !options.onlineOnly || isUserOnline(user.id)
    ),
    loading,
    error
  };
}
