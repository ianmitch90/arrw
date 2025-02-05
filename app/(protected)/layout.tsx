'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatOverlay } from '@/components/chat/ChatOverlay';
import { useChatOverlay } from '@/hooks/useChatOverlay';
import TopNav from '@/components/ui/TopNav';
import MapView from '@/components/map/MapView';
import Messages from '@/components/chat/Messages';
import LoadingScreen from '@/components/LoadingScreen';
import BottomBar from '@/components/Navigation/BottomBar';


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const { isOpen, chatType, onClose } = useChatOverlay();
  const pathname = usePathname();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router, mounted]);

  if (!mounted || loading) {
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
              {(pathname === '/map' || chatType) && (
                <div className="fixed inset-0 z-0">
                  <MapView />
                </div>
              )}

              {/* Show chat in overlay if chat is open, otherwise show normal content */}
              {chatType ? (
                <ChatOverlay
                  isOpen={isOpen}
                  onClose={onClose}
                  chatId={selectedChatId}
                  onBack={
                    selectedChatId ? () => setSelectedChatId(null) : undefined
                  }
                >
                  {/* Render appropriate chat component based on type */}
                  {chatType === 'messages' ? (
                    <Messages
                      selectedChatId={selectedChatId}
                      onSelectChat={setSelectedChatId}
                    />
                  ) : chatType === 'global' ? (
                    <Messages
                      selectedChatId={selectedChatId}
                      onSelectChat={setSelectedChatId}
                    />
                  ) : null}
                </ChatOverlay>
              ) : (
                <motion.div
                  key={pathname}
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
