'use client';

import { ReactNode, Suspense } from 'react';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';
import { useUserSession } from '@/hooks/useUserSession';
import { PushNotificationSubscriber } from '@/components/PushNotificationSubscriber';
import TopNav from '@/components/ui/TopNav';
import BottomNav from '@/components/ui/BottomNav';

export function ProtectedLayoutProvider({ children }: { children: ReactNode }) {
  const { user, loading, preferences } = useUserSession();
  return (
    <UserProvider>
      <ChatProvider>
        <MapProvider>
          <TopNav />
          <main
            id="skip"
            className="min-h-[calc(100dvh-8rem)] md:min-h[calc(100dvh-10rem)] h-full w-full "
          >
            {children}
            {/* Render PushNotificationSubscriber only if user is logged in and has opted for notifications */}
            {user && preferences?.pushNotifications && (
              <PushNotificationSubscriber />
            )}
          </main>
          <BottomNav />
        </MapProvider>
      </ChatProvider>
    </UserProvider>
  );
}
