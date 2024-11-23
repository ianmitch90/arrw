'use client';

import { cn } from '@/utils/cn';
import { Button } from '@nextui-org/react';
import { X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '@/components/contexts/ChatContext';

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
          <div className="flex h-12 items-center gap-2 border-b border-divider px-4">
            <div className="flex flex-1 items-center gap-2">
              {onBack && (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={onBack}
                >
                  <ArrowLeft size={20} />
                </Button>
              )}
              {room && (
                <div className="flex flex-col">
                  <h2 className="text-large font-semibold">{room.name}</h2>
                  <p className="text-small text-default-500">
                    {room.participants?.length || 0} participants
                  </p>
                </div>
              )}
            </div>
            <Button
              isIconOnly
              variant="light"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden p-4">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
