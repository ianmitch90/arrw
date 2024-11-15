type BroadcastMessage = {
  type:
    | 'CACHE_UPDATE'
    | 'PRESENCE_UPDATE'
    | 'LOCATION_UPDATE'
    | 'TAB_SYNC'
    | 'MASTER_CHECK'
    | 'CONFLICT_RESOLUTION';
  data: any;
  timestamp: number;
  tabId: string;
  isMaster?: boolean;
  version?: number;
  conflictResolution?: {
    strategy: 'last-write-wins' | 'merge' | 'master-decides';
    priority?: number;
    mergeStrategy?: 'union' | 'intersection' | 'custom';
  };
};

interface ConflictResolutionStrategy<T> {
  resolve: (local: T, remote: T, metadata?: any) => T;
  priority: number;
}

const TAB_ID = Math.random().toString(36).substring(7);

export class BroadcastService {
  private channel: BroadcastChannel;
  private listeners: Map<string, Set<(message: BroadcastMessage) => void>>;
  private isMaster: boolean = false;
  private lastSupabaseSync: number = 0;
  private readonly SYNC_INTERVAL = 1000;
  private supabaseInstance: any;
  private versionCounter: number = 0;
  private lastKnownVersions: Map<string, number> = new Map();
  private pendingUpdates: Map<string, Set<any>> = new Map();
  private conflictStrategies: Map<string, ConflictResolutionStrategy<any>> =
    new Map();

  constructor(channelName: string, supabaseClient: any) {
    this.channel = new BroadcastChannel(channelName);
    this.listeners = new Map();
    this.supabaseInstance = supabaseClient;
    this.initializeConflictStrategies();
    this.initializeMasterElection();

    this.channel.onmessage = this.handleMessage.bind(this);

    window.addEventListener('beforeunload', () => {
      this.broadcastPendingUpdates();
    });
  }

  private initializeConflictStrategies() {
    // Location update conflict strategy
    this.conflictStrategies.set('LOCATION_UPDATE', {
      priority: 1,
      resolve: (local, remote, metadata) => {
        // Prefer more recent location updates
        return local.timestamp > remote.timestamp ? local : remote;
      }
    });

    // Presence update conflict strategy
    this.conflictStrategies.set('PRESENCE_UPDATE', {
      priority: 2,
      resolve: (local, remote) => {
        // Merge presence states, preferring active over inactive states
        return {
          ...local,
          ...remote,
          status:
            local.status === 'online' || remote.status === 'online'
              ? 'online'
              : 'away',
          lastUpdate: Math.max(local.lastUpdate, remote.lastUpdate)
        };
      }
    });

    // Cache update conflict strategy
    this.conflictStrategies.set('CACHE_UPDATE', {
      priority: 0,
      resolve: (local, remote) => {
        // Merge cache entries, keeping most recent data for each user
        const mergedUsers = new Map();
        [...local.users, ...remote.users].forEach((user) => {
          const existing = mergedUsers.get(user.id);
          if (!existing || user.updated_at > existing.updated_at) {
            mergedUsers.set(user.id, user);
          }
        });
        return {
          ...local,
          users: Array.from(mergedUsers.values()),
          timestamp: Math.max(local.timestamp, remote.timestamp)
        };
      }
    });
  }

  private async handleMessage(event: MessageEvent<BroadcastMessage>) {
    const message = event.data;

    if (message.tabId === TAB_ID) return; // Ignore own messages

    // Version check
    const knownVersion = this.lastKnownVersions.get(message.type) || 0;
    if (message.version && message.version < knownVersion) {
      // Outdated message, ignore
      return;
    }

    // Handle conflicts
    if (this.pendingUpdates.has(message.type)) {
      const strategy = this.conflictStrategies.get(message.type);
      if (strategy) {
        const localUpdates = this.pendingUpdates.get(message.type)!;
        const resolvedData = Array.from(localUpdates).reduce((acc, local) => {
          return strategy.resolve(acc, local);
        }, message.data);

        // Broadcast resolved conflict
        this.broadcast('CONFLICT_RESOLUTION', {
          type: message.type,
          resolvedData,
          originalMessages: [message, ...Array.from(localUpdates)]
        });

        this.pendingUpdates.delete(message.type);
      }
    }

    // Update version tracking
    if (message.version) {
      this.lastKnownVersions.set(message.type, message.version);
    }

    // Handle regular message
    const handlers = this.listeners.get(message.type);
    handlers?.forEach((handler) => handler(message));
  }

  private broadcastPendingUpdates() {
    this.pendingUpdates.forEach((updates, type) => {
      if (updates.size > 0) {
        const strategy = this.conflictStrategies.get(type);
        if (strategy) {
          const resolvedData = Array.from(updates).reduce((acc, update) => {
            return strategy.resolve(acc, update);
          });

          this.broadcast(type as BroadcastMessage['type'], resolvedData);
        }
      }
    });
  }

  public broadcast(type: BroadcastMessage['type'], data: any) {
    const version = ++this.versionCounter;
    const message: BroadcastMessage = {
      type,
      data,
      timestamp: Date.now(),
      tabId: TAB_ID,
      isMaster: this.isMaster,
      version,
      conflictResolution: this.conflictStrategies.get(type)
        ? {
            strategy: this.isMaster ? 'master-decides' : 'merge',
            priority: this.conflictStrategies.get(type)!.priority
          }
        : undefined
    };

    // Store update for potential conflict resolution
    if (!this.pendingUpdates.has(type)) {
      this.pendingUpdates.set(type, new Set());
    }
    this.pendingUpdates.get(type)!.add(data);

    this.channel.postMessage(message);

    // Clean up old pending updates
    setTimeout(() => {
      this.pendingUpdates.get(type)?.delete(data);
    }, this.SYNC_INTERVAL * 2);
  }

  private async initializeMasterElection() {
    // Elect self as master initially
    this.isMaster = true;
    this.lastSupabaseSync = Date.now();

    // Check if other tabs are already master
    this.broadcast('MASTER_CHECK', {});

    // Set up periodic master check
    setInterval(() => {
      if (this.isMaster) {
        this.syncWithSupabase();
      }
    }, this.SYNC_INTERVAL);
  }

  private async syncWithSupabase() {
    if (!this.isMaster) return;

    try {
      // Fetch latest data from Supabase
      const [presenceData, locationData] = await Promise.all([
        this.supabaseInstance
          .from('presence')
          .select('*')
          .gt('updated_at', new Date(this.lastSupabaseSync).toISOString()),
        this.supabaseInstance
          .from('profiles')
          .select('location, location_updated_at')
          .gt(
            'location_updated_at',
            new Date(this.lastSupabaseSync).toISOString()
          )
      ]);

      if (presenceData.data?.length || locationData.data?.length) {
        // Broadcast updates to other tabs
        this.broadcast('TAB_SYNC', {
          presence: presenceData.data,
          locations: locationData.data,
          timestamp: Date.now()
        });
      }

      this.lastSupabaseSync = Date.now();
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  }

  private checkMaster() {
    this.broadcast('MASTER_CHECK', {});

    // Set a timeout to become master if no response
    setTimeout(() => {
      if (!this.isMaster) {
        this.isMaster = true;
        this.syncWithSupabase();
      }
    }, 100);
  }

  subscribe(
    type: BroadcastMessage['type'],
    handler: (message: BroadcastMessage) => void
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)?.add(handler);

    return () => {
      this.listeners.get(type)?.delete(handler);
    };
  }

  close() {
    if (this.isMaster) {
      // Notify other tabs that master is going away
      this.broadcast('MASTER_CHECK', { masterClosing: true });
    }
    this.channel.close();
    this.listeners.clear();
  }
}

export const broadcastService = new BroadcastService(
  'dating-app',
  supabaseClient
);
