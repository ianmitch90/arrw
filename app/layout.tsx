import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { SessionManagerProvider } from '@/context/SessionManagerContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ARRW',
  description: 'Location-based social platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning={true}>
        <Providers>
          <AuthProvider>
            <SessionManagerProvider>
              <Toaster />
              {children}
            </SessionManagerProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
