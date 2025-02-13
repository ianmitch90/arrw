'use client';

import { Suspense } from 'react';
import { HeroUIProvider } from '@heroui/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/Toasts/toaster';

export default function LayoutProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <HeroUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
        <Suspense>
          <Toaster />
        </Suspense>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
