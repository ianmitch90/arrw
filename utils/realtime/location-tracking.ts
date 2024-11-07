import { supabase } from '@/utils/supabase/client';
import { LocationPrivacyManager } from '@/utils/location-privacy';
import { Coordinates } from '@/types/location.types';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LocationUpdate {
  userId: string;
  location: Coordinates;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export class LocationTrackingSystem {
  private watchId: number | null = null;
  private channel: RealtimeChannel | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdate: LocationUpdate | null = null;

  async initialize() {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const privacySettings = await LocationPrivacyManager.getPrivacySettings(
      user.id
    );
    if (!LocationPrivacyManager.shouldTrackLocation(privacySettings)) {
      return;
    }

    // Set up realtime channel
    this.channel = supabase.channel('location_updates', {
      config: {
        broadcast: { self: false },
        presence: { key: user.id }
      }
    });

    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        this.startTracking();
      }
    });
  }

  private startTracking() {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    // Start watching position
    this.watchId = navigator.geolocation.watchPosition(
      async (position) => {
        await this.handlePositionUpdate(position);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 27000
      }
    );

    // Set up periodic updates to database
    this.updateInterval = setInterval(async () => {
      if (this.lastUpdate) {
        await this.saveLocationUpdate(this.lastUpdate);
      }
    }, 60000); // Save location every minute
  }

  private async handlePositionUpdate(position: GeolocationPosition) {
    const update: LocationUpdate = {
      userId: (await supabase.auth.getUser()).data.user!.id,
      location: {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      timestamp: new Date().toISOString(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || undefined,
      heading: position.coords.heading || undefined
    };

    this.lastUpdate = update;

    // Broadcast update
    if (this.channel) {
      await this.channel.send({
        type: 'broadcast',
        event: 'location_update',
        payload: update
      });
    }
  }

  private async saveLocationUpdate(update: LocationUpdate) {
    const { error } = await supabase.from('location_history').insert({
      user_id: update.userId,
      location: `POINT(${update.location.longitude} ${update.location.latitude})`,
      timestamp: update.timestamp,
      accuracy: update.accuracy,
      speed: update.speed,
      heading: update.heading
    });

    if (error) {
      console.error('Error saving location:', error);
    }
  }

  stop() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.lastUpdate = null;
  }
}
