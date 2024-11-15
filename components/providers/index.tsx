'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { AppProvider } from '@/contexts/AppContext';
import { NextUIProvider } from '@nextui-org/react';

export function Providers({
  children,
  themeProps
}: {
  children: React.ReactNode;
  themeProps: ThemeProviderProps;
}) {
  return (
    <NextThemesProvider {...themeProps}>
      <NextUIProvider>
        <AppProvider>{children}</AppProvider>
      </NextUIProvider>
    </NextThemesProvider>
  );
}
