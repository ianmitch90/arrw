import { LocationPrivacySettings } from '@/types/location.types';
import { supabase } from './supabase/client';

export class LocationPrivacyManager {
  static async getPrivacySettings(
    userId: string
  ): Promise<LocationPrivacySettings> {
    const { data, error } = await supabase
      .from('profiles')
      .select('privacy_settings')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return (
      data?.privacy_settings || {
        shareLocation: true,
        showDistance: true,
        allowLocationHistory: true
      }
    );
  }

  static async updatePrivacySettings(
    userId: string,
    settings: Partial<LocationPrivacySettings>
  ): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({
        privacy_settings: settings
      })
      .eq('id', userId);

    if (error) throw error;
  }

  static shouldTrackLocation(settings: LocationPrivacySettings): boolean {
    return settings.allowLocationHistory && settings.shareLocation;
  }

  static shouldShowDistance(settings: LocationPrivacySettings): boolean {
    return settings.showDistance && settings.shareLocation;
  }

  static async clearLocationHistory(userId: string): Promise<void> {
    const { error } = await supabase
      .from('location_history')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  }
}
