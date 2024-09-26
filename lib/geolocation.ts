import { supabase } from './supabaseClient';

export async function cacheUserLocation(
  userId: string,
  latitude: number,
  longitude: number
) {
  const { data, error } = await supabase
    .from('user_locations')
    .upsert(
      { user_id: userId, latitude, longitude },
      { onConflict: 'user_id' }
    );

  if (error) {
    console.error('Error caching user location:', error);
  }
}
