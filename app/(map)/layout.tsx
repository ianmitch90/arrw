'use client';

import { useRouter } from 'next/navigation';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { PersistentMapLayout } from '@/components/layout/PersistentMapLayout';

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
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!session || error) {
          router.push('/auth/signin');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        toast({
          title: 'Authentication Error',
          description: 'Please sign in to continue.',
          variant: 'destructive',
        });
        router.push('/auth/signin');
      }
    };

    checkAuth();
  }, [user, router, supabase.auth, toast]);

  if (!user) {
    return null;
  }

  return <PersistentMapLayout>{children}</PersistentMapLayout>;
}
