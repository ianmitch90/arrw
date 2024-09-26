'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';

export function useUserSession() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<{
    pushNotifications: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const session = await supabase.auth.getSession();
      const user = session?.data?.session?.user;
      if (user) {
        setUser(user as unknown as User);
      } else {
        setUser(null);
      }
      setLoading(false);

      const fetchPreferences = async () => {
        if (user) {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('pushNotifications')
            .eq('user_id', user.id)
            .single();

          if (data) {
            setPreferences(data);
          }
        }
      };

      await fetchPreferences();

      const { data: authListener } = supabase.auth.onAuthStateChange(
        (_, session) => {
          setUser(session?.user as unknown as User | null);
          setLoading(false);
        }
      );

      return () => {
        authListener?.subscription.unsubscribe();
      };
    };

    fetchSession();
  }, []);

  return { user, loading, preferences };
}
