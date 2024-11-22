'use client';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@nextui-org/react';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <UserProvider>
      <ChatProvider>
        <MapProvider>
          <div className="flex min-h-screen flex-col">
            <TopNav />
            <main className="flex-1 container mx-auto px-4 py-4">
              {children}
            </main>
            <BottomNav />
          </div>
        </MapProvider>
      </ChatProvider>
    </UserProvider>
  );
}
