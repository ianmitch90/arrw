import { Coordinates, CityBoundary } from '@/types/location.types';
import { supabase } from '@/utils/supabase/client';

export class CityBoundaryService {
  static async findNearestCity(
    coords: Coordinates
  ): Promise<CityBoundary | null> {
    const { data, error } = await supabase.rpc('find_nearest_city', {
      lat: coords.latitude,
      lng: coords.longitude,
      radius_miles: 50 // Default max radius
    });

    if (error) throw error;
    return data;
  }

  static async isWithinCity(
    coords: Coordinates,
    cityId: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_within_city_boundary', {
      lat: coords.latitude,
      lng: coords.longitude,
      city_id: cityId
    });

    if (error) throw error;
    return data;
  }

  static async getCityBoundary(cityId: string): Promise<CityBoundary | null> {
    const { data, error } = await supabase
      .from('city_boundaries')
      .select('*')
      .eq('id', cityId)
      .single();

    if (error) throw error;
    return data;
  }
}
