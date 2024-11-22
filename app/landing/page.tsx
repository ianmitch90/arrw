'use client';
import React from 'react';
import { useAuth } from '@/utils/auth-helpers/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (user) {
      router.push('/map');
    }
  }, [user, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-2">
      <div className="mb-8 text-center">
        <Image
          src="/logo.svg"
          alt="ARRW"
          width={120}
          height={120}
          className="mx-auto"
          priority
        />
        <h1 className="mt-6 text-6xl font-bold">Welcome to ARRW</h1>
        <p className="mt-3 text-2xl text-default-500">Discover your world</p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-full bg-primary px-8 py-3 font-semibold text-white transition-transform hover:scale-105"
        >
          Login
        </Link>
        <Link
          href="/signup"
          className="rounded-full border-2 border-primary px-8 py-3 font-semibold text-primary transition-transform hover:scale-105"
        >
          Sign Up
        </Link>
      </div>
    </div>
  );
}
