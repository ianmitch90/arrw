interface CacheOptions {
  ttl: number;
  key: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class SessionCache {
  private static defaultTTL = 5 * 60 * 1000; // 5 minutes

  static set<T>(data: T, options: Partial<CacheOptions> = {}) {
    const key = options.key || 'default-cache';
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now()
    };

    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
      console.warn('Session storage write failed:', error);
      // Fallback to memory-only cache if needed
    }
  }

  static get<T>(key: string, ttl = this.defaultTTL): T | null {
    try {
      const stored = sessionStorage.getItem(key);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      if (Date.now() - entry.timestamp > ttl) {
        sessionStorage.removeItem(key);
        return null;
      }

      return entry.data;
    } catch {
      return null;
    }
  }

  static clear(key?: string) {
    if (key) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.clear();
    }
  }
}
