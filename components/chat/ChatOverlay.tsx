'use client';

import { cn } from '@/utils/cn';
import { Button } from '@nextui-org/react';
import { X, ArrowLeft, Pin, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/components/contexts/ChatContext';
import { useState } from 'react';
import MessagingChatHeader from '@/components/chat/MessagingChatHeader';

interface ChatOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
  onBack?: () => void;
}

export function ChatOverlay({ children, isOpen, onClose, chatId, onBack }: ChatOverlayProps) {
  const { rooms = [], users = [] } = useChat();
  const room = chatId ? rooms.find(r => r.id === chatId) : null;
  const otherUser = room?.participants?.[0];
  const user = otherUser ? users.find(u => u.id === otherUser.id) : null;
  const [isPinned, setIsPinned] = useState(false);

  // Format height to feet and inches
  const formatHeight = (cm?: number) => {
    if (!cm) return null;
    const inches = cm / 2.54;
    const feet = Math.floor(inches / 12);
    const remainingInches = Math.round(inches % 12);
    return `${feet}'${remainingInches}"`;
  };

  // Format weight to lbs
  const formatWeight = (kg?: number) => {
    if (!kg) return null;
    return `${Math.round(kg * 2.20462)}lbs`;
  };

  const displayInfo = [
    formatHeight(user?.profile?.height),
    formatWeight(user?.profile?.weight),
    user?.profile?.body_type,
    user?.profile?.sexual_positions?.[0]
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cn(
            'fixed inset-x-0 top-[16vh] bottom-[16vh] z-50 flex flex-col overflow-hidden bg-background md:inset-auto md:right-4 md:top-[16vh] md:h-[66vh] md:w-[400px] md:rounded-lg md:border md:shadow-lg'
          )}
        >
          <div className="flex h-[72px] flex-col justify-center border-b border-divider px-3">
            <div className="flex items-center justify-between">
              {/* Left: Back button */}
              <div className="w-8">
                {onBack && (
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={onBack}
                    className="h-8 w-8"
                  >
                    <ArrowLeft size={18} />
                  </Button>
                )}
              </div>

              {/* Center: Title or User info */}
              {room ? (
                <div className="flex flex-col items-start px-2">
                  <h2 className="text-sm font-medium">
                    {user?.role === 'anon'
                      ? 'Anonymous Cruiser'
                      : user?.username}
                  </h2>
                  {displayInfo.length > 0 && (
                    <p className="text-xs text-default-500">
                      {displayInfo.join(' • ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-start px-2">
                  <MessagingChatHeader page={0} />
                </div>
              )}

              {/* Right: Action buttons */}
              <div className="flex gap-1">
                {room && (
                  <>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onClick={() => setIsPinned(!isPinned)}
                      className="h-8 w-8"
                    >
                      <Pin
                        size={18}
                        className={cn(isPinned && 'text-primary')}
                      />
                    </Button>
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      className="h-8 w-8"
                    >
                      <Video size={18} />
                    </Button>
                  </>
                )}
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
