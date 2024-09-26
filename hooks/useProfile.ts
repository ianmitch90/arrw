import { useState, useEffect } from 'react';
import { Profile } from '../types';
import { supabase } from '../lib/supabaseClient';

export function useProfile(userId: string) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    }

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  return { profile, loading };
}
