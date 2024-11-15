import { useEffect, useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <div
        className={
          mounted ? 'dark text-foreground bg-background h-full w-full' : ''
        }
        style={{ visibility: mounted ? 'visible' : 'hidden' }}
      >
        {children}
      </div>
    </NextThemesProvider>
  );
}
