'use client';
import React from 'react';
import { useAuth } from '@/utils/auth-helpers/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.push('/map');
    }
  }, [user, router]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col items-center justify-center min-h-screen py-2">
        <h1 className="text-6xl font-bold">Welcome to Our App</h1>
        <p className="mt-3 text-2xl">Get started by logging in or signing up</p>
        <div className="flex mt-6">
          <Link href="/auth/login" className="mr-4 btn btn-primary">
            Login
          </Link>
          <Link href="/auth/sign-up" className="btn btn-secondary">
            Sign Up
          </Link>
        </div>
      </div>
    </ErrorBoundary>
  );
}
