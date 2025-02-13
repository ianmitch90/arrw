'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { AppProvider } from '@/contexts/AppContext';
import { HeroUIProvider } from '@heroui/react';

export function Providers({
  children,
  themeProps
}: {
  children: React.ReactNode;
  themeProps: ThemeProviderProps;
}) {
  return (
    <NextThemesProvider {...themeProps}>
      <HeroUIProvider>
        <AppProvider>{children}</AppProvider>
      </HeroUIProvider>
    </NextThemesProvider>
  );
}
