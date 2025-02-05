import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useLocation } from '@/contexts/LocationContext';
import { Database } from '@/types_db';

export class PresenceSystem {
  private channel: any;
  private supabase: any;
  private userId: string;
  private location: { latitude: number; longitude: number } | null;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.location = null;
  }

  public async initialize() {
    this.channel = this.supabase.channel(`presence:${this.userId}`, {
      config: {
        presence: {
          key: this.userId,
        },
      },
    });

    await this.channel.subscribe();
  }

  public async updateLocation(location: { latitude: number; longitude: number }) {
    this.location = location;

    if (this.channel) {
      await this.channel.track({
        user_id: this.userId,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        online_at: new Date().toISOString(),
      });
    }
  }

  public async dispose() {
    if (this.channel) {
      await this.channel.unsubscribe();
    }
  }
}

export function usePresence() {
  const supabase = useSupabaseClient<Database>();
  const { location } = useLocation();

  return {
    updatePresence: async (userId: string) => {
      if (!location) return;

      const presenceSystem = new PresenceSystem(supabase, userId);
      await presenceSystem.initialize();
      await presenceSystem.updateLocation(location);

      return presenceSystem;
    }
  };
}
