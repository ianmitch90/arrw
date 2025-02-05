import { supabase } from '@/utils/supabase/client';
import { LocationPrivacyManager } from '@/utils/location-privacy';
import { Coordinates } from '@/types/location.types';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Map } from 'mapbox-gl';
import { toast } from '@/components/ui/use-toast';

export interface LocationUpdate {
  userId: string;
  location: Coordinates;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
}

export class LocationTrackingSystem {
  private map: Map | null = null;
  private channel: RealtimeChannel | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastUpdate: LocationUpdate | null = null;
  private onLocationUpdate: ((coords: { latitude: number; longitude: number }) => void) | null = null;

  async initialize(map: Map) {
    this.map = map;

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
    this.onLocationUpdate = this.handlePositionUpdate;

    // Listen for geolocate events from GeolocateControl
    if (this.map) {
      this.map.on('geolocate', this.handleGeolocate);
    } else {
      toast({
        description: 'Map not initialized',
        variant: 'error'
      });
    }

    // Set up periodic updates to database
    this.updateInterval = setInterval(async () => {
      if (this.lastUpdate) {
        await this.saveLocationUpdate(this.lastUpdate);
      }
    }, 60000); // Save location every minute
  }

  private handleGeolocate = (e: any) => {
    if (e.coords && this.onLocationUpdate) {
      this.onLocationUpdate({
        latitude: e.coords.latitude,
        longitude: e.coords.longitude
      });
    }
  };

  private async handlePositionUpdate(coords: { latitude: number; longitude: number }) {
    const update: LocationUpdate = {
      userId: (await supabase.auth.getUser()).data.user!.id,
      location: coords,
      timestamp: new Date().toISOString()
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
      timestamp: update.timestamp
    });

    if (error) {
      console.error('Error saving location:', error);
    }
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.map) {
      this.map.off('geolocate', this.handleGeolocate);
    }
    this.onLocationUpdate = null;

    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }

    this.lastUpdate = null;
  }
}
