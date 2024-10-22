'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/utils/supabase/client';

export default function ConfirmPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      auth.setSession(token);
      router.push('/map');
    } else {
      router.push('/auth/login');
    }
  }, [router, searchParams]);

  return null; // This page is just for handling the token
}
