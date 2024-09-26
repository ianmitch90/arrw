'use client';
import React, { PropsWithChildren } from 'react';
import { useUserSession } from '../../hooks/useUserSession';
import { useRouter } from 'next/navigation';

const LandingPage = ({ children }: PropsWithChildren) => {
  const { user, loading } = useUserSession();
  const router = useRouter();

  // Redirect to landing page if not logged in
  if (!loading && !user) {
    router.push('/map/landing');
  }

  return <>{children}</>;
};

export default LandingPage;
