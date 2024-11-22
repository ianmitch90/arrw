'use client';

import { ReactNode } from 'react';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';
import { useAuth } from '@/context/AuthContext';
import { PushNotificationSubscriber } from '@/components/PushNotificationSubscriber';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';
import { Spinner } from '@nextui-org/react';

export function ProtectedLayoutProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();

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
          <TopNav />
          <main
            id="skip"
            className="min-h-[calc(100dvh-8rem)] md:min-h[calc(100dvh-10rem)] h-full w-full"
          >
            {children}
            {/* Render PushNotificationSubscriber only if user has opted for notifications */}
            {user?.user_metadata?.preferences?.pushNotifications && (
              <PushNotificationSubscriber />
            )}
          </main>
          <BottomNav />
        </MapProvider>
      </ChatProvider>
    </UserProvider>
  );
}
