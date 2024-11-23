'use client';

import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@nextui-org/react';
import BottomBar from '@/components/Navigation/BottomBar';
import { MapProvider } from '@/components/contexts/MapContext';
import { UserProvider } from '@/components/contexts/UserContext';
import { ChatProvider } from '@/components/contexts/ChatContext';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ChatOverlay } from '@/components/chat/ChatOverlay';
import { useChatOverlay } from '@/hooks/useChatOverlay';
import TopNav from '@/components/ui/TopNav';
import MapView from '@/components/map/MapView';
import Messages from '@/components/chat/Messages';
import GlobalChat from '@/components/chat/GlobalChat';

const pageTransitionVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const LoadingSpinner = () => (
  <div className="flex h-[80vh] items-center justify-center">
    <Spinner size="lg" color="primary" />
  </div>
);

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { loading, user } = useAuth();
  const { isOpen, chatType, onClose } = useChatOverlay();
  const pathname = usePathname();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <UserProvider>
      <ChatProvider>
        <MapProvider>
          <div className="min-h-screen bg-background">
            {/* <TopNav /> */}
            <main className="pb-24">
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
                  onBack={selectedChatId ? () => setSelectedChatId(null) : undefined}
                >
                  {/* Render appropriate chat component based on type */}
                  {chatType === 'messages' ? (
                    <Messages 
                      selectedChatId={selectedChatId}
                      onSelectChat={setSelectedChatId}
                    />
                  ) : chatType === 'global' ? (
                    <GlobalChat />
                  ) : null}
                </ChatOverlay>
              ) : (
                <motion.div
                  key={pathname}
                  className="relative z-10"
                  variants={pageTransitionVariants}
                  initial="initial"
                  animate="enter"
                  exit="exit"
                  transition={{ 
                    type: "spring",
                    stiffness: 380,
                    damping: 30
                  }}
                >
                  <Suspense fallback={<LoadingSpinner />}>
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
