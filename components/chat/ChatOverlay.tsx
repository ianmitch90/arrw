'use client';

import { cn } from '@/utils/cn';
import { Button } from '@nextui-org/react';
import { X, Pin, Video, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/components/contexts/ChatContext';
import { useState } from 'react';
import MessagingChatHeader from '@/components/chat/MessagingChatHeader';
import { formatDistanceToNow } from 'date-fns';

interface ChatOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  chatId?: string;
  onBack?: () => void;
}

export function ChatOverlay({ children, isOpen, onClose, chatId, onBack }: ChatOverlayProps) {
  const { rooms = [] } = useChat();
  const room = chatId ? rooms.find(r => r.id === chatId) : null;
  const otherUser = room?.participants?.[0];
  const [isPinned, setIsPinned] = useState(false);

  const displayInfo = [
    otherUser?.status === 'active' ? 'Online' : 'Offline',
    otherUser?.lastSeen && `Last seen ${formatDistanceToNow(otherUser.lastSeen, { addSuffix: true })}`
  ].filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'tween' }}
          className={cn(
            "fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-background shadow-xl sm:w-[400px]",
            isPinned && "relative"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-4">
            <div className="flex items-center gap-2">
              {/* Back button */}
              {onBack && (
                <button
                  onClick={onBack}
                  className="rounded-full p-2 hover:bg-default-100"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Center: Title or User info */}
              {room ? (
                <div className="flex flex-col items-start px-2">
                  <h2 className="text-sm font-medium">
                    {otherUser?.fullName || 'Anonymous User'}
                  </h2>
                  {displayInfo.length > 0 && (
                    <p className="text-xs text-default-500">
                      {displayInfo.join(' • ')}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-start px-2">
                  <MessagingChatHeader />
                </div>
              )}
            </div>

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
          <div className="flex-1 overflow-hidden">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
