'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ResponsiveOverlay } from '@/components/ui/ResponsiveOverlay';
import { useBreakpoint } from '@/hooks/useBreakpoint';

import { useChatToOverlay } from '@/hooks/useChatToOverlay';

import MapView from '@/components/map/MapView';
import Messages from '@/components/chat/Messages';
import LoadingScreen from '@/components/LoadingScreen';
import { ChatBridge } from '@/components/chat/ChatBridge';

import BottomBar from '@/components/Navigation/BottomBar';


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isMobile, isTablet } = useBreakpoint();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [isLoading, user, router, mounted]);

  if (!mounted || isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <UserProvider>
      <ChatProvider>
        <MapProvider>
            <div className="min-h-screen bg-background">
              {/* <TopNav /> */}
              <main>
                {/* Show map by default on map route or when chat is open */}
                {pathname === '/map' && (
                  <div className="fixed inset-0 z-0">
                    <MapView />
                  </div>
                )}

                {/* Bridge between chat and overlay systems */}
                <ChatBridge />

                {/* Responsive overlay handles mobile/desktop switching */}
                <ResponsiveOverlay />

                {/* Main content */}
                {true && (
                  <motion.div
                    key={pathname}
                    as="div"
                    className="relative z-10"
                    variants={{
                      initial: { opacity: 0, y: 20 },
                      enter: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: -20 }
                    }}
                    initial="initial"
                    animate="enter"
                    exit="exit"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 30
                    }} 
                  >
                    <Suspense
                      fallback={
                        <div className="flex h-[80vh] items-center justify-center">
                          <LoadingScreen />
                        </div>
                      }
                    >
                      {children}
                    </Suspense>
                  </motion.div>
                )}
              </main>
              <BottomBar />
            </div>
        </MapProvider>
      </ChatProvider>
    </UserProvider>
  );
}
