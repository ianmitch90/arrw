import { supabase } from '@/utils/supabase/client';
import { LocationState } from '@/types/location.types';
import { RealtimeChannel } from '@supabase/supabase-js';

export class PresenceSystem {
  private channels: Map<string, RealtimeChannel> = new Map();
  private presenceStates: Map<string, any> = new Map();
  private locationUpdateInterval: NodeJS.Timeout | null = null;

  async initialize(userId: string, locationState: LocationState) {
    // Initialize presence channel
    const presenceChannel = supabase.channel('presence', {
      config: {
        presence: {
          key: userId
        }
      }
    });

    // Set up presence handlers
    await this.setupPresenceHandlers(presenceChannel, userId, locationState);

    // Start location updates
    this.startLocationUpdates(presenceChannel, locationState);

    this.channels.set('presence', presenceChannel);
  }

  private async setupPresenceHandlers(
    channel: RealtimeChannel,
    userId: string,
    locationState: LocationState
  ) {
    await channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          location: locationState.currentLocation,
          status: 'online'
        });
      }
    });
  }

  private startLocationUpdates(
    channel: RealtimeChannel,
    locationState: LocationState
  ) {
    this.locationUpdateInterval = setInterval(async () => {
      if (locationState.currentLocation) {
        await channel.track({
          location: locationState.currentLocation,
          updated_at: new Date().toISOString()
        });
      }
    }, 30000); // Update every 30 seconds
  }

  dispose() {
    if (this.locationUpdateInterval) {
      clearInterval(this.locationUpdateInterval);
    }

    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.presenceStates.clear();
  }
}
