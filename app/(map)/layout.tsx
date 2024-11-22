'use client';

import { useRouter } from 'next/navigation';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | ARRW Map',
    default: 'ARRW - Interactive Map',
  },
  description: 'Explore and connect with people around you in real-time.',
};

export default function MapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        if (!user) {
          router.replace('/auth/login');
          return;
        }

        // Check age verification
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('age_verified')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (!profile?.age_verified) {
          toast({
            title: 'Age Verification Required',
            description: 'Please verify your age to access this section.',
            variant: 'destructive',
          });
          router.replace('/auth/verify-age');
          return;
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.replace('/auth/login');
      }
    };

    checkAuth();
  }, [user, router, supabase, toast]);

  // Show nothing while checking auth
  if (!user) return null;

  return (
    <div className="flex h-screen w-screen flex-col">
      {children}
    </div>
  );
}
