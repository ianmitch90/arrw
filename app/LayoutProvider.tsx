'use client';

import { Suspense } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { Toaster } from '@/components/ui/Toasts/toaster';

export default function LayoutProvider({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <NextUIProvider>
      <NextThemesProvider attribute="class" defaultTheme="dark">
        {children}
        <Suspense>
          <Toaster />
        </Suspense>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
