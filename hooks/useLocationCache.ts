import { useEffect, useRef, useState } from 'react';
import { LngLat } from 'mapbox-gl';
import type { Database } from '@/types/database.types';
import { broadcastService } from '@/utils/broadcastChannel';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface CachedLocation {
  center: LngLat;
  radius: number;
  timestamp: number;
  users: Profile[];
  metadata: {
    zoom: number;
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    };
    lastUpdate: number;
    hitCount: number;
    dataFreshness: 'fresh' | 'stale' | 'expired';
  };
}

interface CacheConfig {
  maxAge: number;
  staleAge: number;
  maxEntries: number;
  maxHits: number;
  coordinatePrecision: number;
  boundsOverlap: number;
}

const DEFAULT_CONFIG: CacheConfig = {
  maxAge: 300000, // 5 minutes
  staleAge: 60000, // 1 minute
  maxEntries: 10,
  maxHits: 50,
  coordinatePrecision: 3, // Round to 3 decimal places
  boundsOverlap: 0.2 // 20% overlap threshold
};

interface CacheAnalytics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  averageAge: number;
  sizeDistribution: {
    fresh: number;
    stale: number;
    expired: number;
  };
  performanceMetrics: {
    averageLoadTime: number;
    cacheSize: number;
    memoryUsage: number;
  };
}

export function useLocationCache(config: Partial<CacheConfig> = {}) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const cache = useRef<Map<string, CachedLocation>>(new Map());
  const stats = useRef<{
    hits: number;
    misses: number;
    evictions: number;
  }>({ hits: 0, misses: 0, evictions: 0 });
  const [analytics, setAnalytics] = useState<CacheAnalytics>({
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    averageAge: 0,
    sizeDistribution: { fresh: 0, stale: 0, expired: 0 },
    performanceMetrics: {
      averageLoadTime: 0,
      cacheSize: 0,
      memoryUsage: 0
    }
  });

  const roundCoordinate = (coord: number) => {
    return (
      Math.round(coord * Math.pow(10, settings.coordinatePrecision)) /
      Math.pow(10, settings.coordinatePrecision)
    );
  };

  const generateCacheKey = (center: LngLat, radius: number) => {
    const lat = roundCoordinate(center.lat);
    const lng = roundCoordinate(center.lng);
    return `${lat},${lng}-${radius}`;
  };

  const calculateBounds = (center: LngLat, radius: number) => {
    // Approximate degrees per meter at this latitude
    const metersPerDegree = 111320 * Math.cos((center.lat * Math.PI) / 180);
    const radiusDegrees = radius / metersPerDegree;

    return {
      north: center.lat + radiusDegrees,
      south: center.lat - radiusDegrees,
      east: center.lng + radiusDegrees,
      west: center.lng - radiusDegrees
    };
  };

  const boundsOverlap = (
    bounds1: CachedLocation['metadata']['bounds'],
    bounds2: CachedLocation['metadata']['bounds']
  ) => {
    const overlapThreshold = settings.boundsOverlap;

    const horizontalOverlap =
      Math.min(bounds1.east, bounds2.east) -
      Math.max(bounds1.west, bounds2.west);
    const verticalOverlap =
      Math.min(bounds1.north, bounds2.north) -
      Math.max(bounds1.south, bounds2.south);

    if (horizontalOverlap <= 0 || verticalOverlap <= 0) return 0;

    const area1 =
      (bounds1.east - bounds1.west) * (bounds1.north - bounds1.south);
    const area2 =
      (bounds2.east - bounds2.west) * (bounds2.north - bounds2.south);
    const overlapArea = horizontalOverlap * verticalOverlap;

    return overlapArea / Math.min(area1, area2);
  };

  const getFreshness = (
    timestamp: number
  ): CachedLocation['metadata']['dataFreshness'] => {
    const age = Date.now() - timestamp;
    if (age < settings.staleAge) return 'fresh';
    if (age < settings.maxAge) return 'stale';
    return 'expired';
  };

  const evictLeastValuable = () => {
    let leastValuableKey: string | null = null;
    let lowestScore = Infinity;

    for (const [key, entry] of cache.current.entries()) {
      // Score based on age, hits, and freshness
      const age = Date.now() - entry.timestamp;
      const freshnessFactor =
        entry.metadata.dataFreshness === 'fresh'
          ? 1
          : entry.metadata.dataFreshness === 'stale'
            ? 0.5
            : 0.1;
      const score = (entry.metadata.hitCount * freshnessFactor) / age;

      if (score < lowestScore) {
        lowestScore = score;
        leastValuableKey = key;
      }
    }

    if (leastValuableKey) {
      cache.current.delete(leastValuableKey);
      stats.current.evictions++;
    }
  };

  const isLocationCached = (center: LngLat, radius: number) => {
    const key = generateCacheKey(center, radius);
    const cached = cache.current.get(key);

    if (!cached) {
      stats.current.misses++;
      return false;
    }

    const freshness = getFreshness(cached.timestamp);
    if (freshness === 'expired') {
      cache.current.delete(key);
      stats.current.misses++;
      return false;
    }

    cached.metadata.hitCount++;
    stats.current.hits++;
    return true;
  };

  const getCachedUsers = (center: LngLat, radius: number) => {
    const key = generateCacheKey(center, radius);
    const cached = cache.current.get(key);

    if (!cached) return [];

    // Update metadata
    cached.metadata.hitCount++;
    cached.metadata.dataFreshness = getFreshness(cached.timestamp);

    return cached.users;
  };

  const cacheLocation = (
    center: LngLat,
    radius: number,
    users: Profile[],
    zoom: number
  ) => {
    const key = generateCacheKey(center, radius);

    // Check cache size and evict if necessary
    if (cache.current.size >= settings.maxEntries) {
      evictLeastValuable();
    }

    // Calculate bounds for this location
    const bounds = calculateBounds(center, radius);

    // Check for overlapping areas and merge if necessary
    for (const [existingKey, existingCache] of cache.current.entries()) {
      const overlap = boundsOverlap(bounds, existingCache.metadata.bounds);
      if (overlap > settings.boundsOverlap) {
        // Merge user data, keeping the most recent data
        const mergedUsers = new Map();
        [...existingCache.users, ...users].forEach((user) => {
          mergedUsers.set(user.id, user);
        });
        users = Array.from(mergedUsers.values());
        cache.current.delete(existingKey);
      }
    }

    const entry: CachedLocation = {
      center,
      radius,
      timestamp: Date.now(),
      users,
      metadata: {
        zoom,
        bounds,
        lastUpdate: Date.now(),
        hitCount: 0,
        dataFreshness: 'fresh'
      }
    };

    cache.current.set(key, entry);

    // Broadcast the update to other tabs
    broadcastService.broadcast('CACHE_UPDATE', {
      key,
      entry,
      action: 'set'
    });
  };

  // Cache maintenance
  useEffect(() => {
    const cleanup = () => {
      const now = Date.now();
      for (const [key, value] of cache.current.entries()) {
        if (getFreshness(value.timestamp) === 'expired') {
          cache.current.delete(key);
          stats.current.evictions++;
        }
      }
    };

    const interval = setInterval(cleanup, settings.staleAge);

    return () => {
      clearInterval(interval);
    };
  }, [settings.staleAge]);

  // Persist cache to localStorage
  useEffect(() => {
    // Load cached data from localStorage
    const loadPersistedCache = () => {
      try {
        const persistedData = localStorage.getItem('location-cache');
        if (persistedData) {
          const { cache: cachedData, timestamp } = JSON.parse(persistedData);

          // Only restore if cache isn't too old
          if (Date.now() - timestamp < settings.maxAge) {
            cache.current = new Map(Object.entries(cachedData));
          }
        }
      } catch (err) {
        console.error('Error loading persisted cache:', err);
      }
    };

    loadPersistedCache();

    // Set up periodic cache persistence
    const persistInterval = setInterval(() => {
      try {
        const cacheData = Object.fromEntries(cache.current.entries());
        localStorage.setItem(
          'location-cache',
          JSON.stringify({
            cache: cacheData,
            timestamp: Date.now()
          })
        );
      } catch (err) {
        console.error('Error persisting cache:', err);
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(persistInterval);
  }, []);

  // Update analytics
  useEffect(() => {
    const updateAnalytics = () => {
      const now = Date.now();
      let totalAge = 0;
      let freshCount = 0;
      let staleCount = 0;
      let expiredCount = 0;
      let totalLoadTime = 0;
      let loadTimeCount = 0;

      cache.current.forEach((entry) => {
        const age = now - entry.timestamp;
        totalAge += age;

        const freshness = getFreshness(entry.timestamp);
        if (freshness === 'fresh') freshCount++;
        else if (freshness === 'stale') staleCount++;
        else expiredCount++;

        if (entry.metadata?.loadTime) {
          totalLoadTime += entry.metadata.loadTime;
          loadTimeCount++;
        }
      });

      const totalOperations = stats.current.hits + stats.current.misses;

      setAnalytics({
        hitRate: totalOperations ? stats.current.hits / totalOperations : 0,
        missRate: totalOperations ? stats.current.misses / totalOperations : 0,
        evictionRate: totalOperations
          ? stats.current.evictions / totalOperations
          : 0,
        averageAge: cache.current.size ? totalAge / cache.current.size : 0,
        sizeDistribution: {
          fresh: freshCount,
          stale: staleCount,
          expired: expiredCount
        },
        performanceMetrics: {
          averageLoadTime: loadTimeCount ? totalLoadTime / loadTimeCount : 0,
          cacheSize: cache.current.size,
          memoryUsage: estimateMemoryUsage()
        }
      });
    };

    const analyticsInterval = setInterval(updateAnalytics, 5000);
    return () => clearInterval(analyticsInterval);
  }, []);

  // Handle cache updates from other tabs
  useEffect(() => {
    const unsubscribe = broadcastService.subscribe(
      'CACHE_UPDATE',
      (message) => {
        const {
          data: { key, entry, action }
        } = message;

        if (action === 'set') {
          cache.current.set(key, entry);
        } else if (action === 'delete') {
          cache.current.delete(key);
        } else if (action === 'clear') {
          cache.current.clear();
        }

        // Trigger analytics update
        updateAnalytics();
      }
    );

    return () => unsubscribe();
  }, []);

  const estimateMemoryUsage = () => {
    try {
      const serialized = JSON.stringify(
        Object.fromEntries(cache.current.entries())
      );
      return new Blob([serialized]).size;
    } catch (err) {
      return 0;
    }
  };

  return {
    isLocationCached,
    getCachedUsers,
    cacheLocation,
    stats: stats.current,
    analytics,
    clearCache: () => {
      cache.current.clear();
      stats.current = { hits: 0, misses: 0, evictions: 0 };
      localStorage.removeItem('location-cache');

      broadcastService.broadcast('CACHE_UPDATE', {
        action: 'clear'
      });
    }
  };
}
