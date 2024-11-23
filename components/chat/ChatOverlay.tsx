'use client';

import { cn } from '@/utils/cn';
import { Button } from '@nextui-org/react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatOverlayProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatOverlay({ children, isOpen, onClose }: ChatOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          className={cn(
            'fixed inset-0 z-50 flex flex-col overflow-hidden bg-background p-4 md:inset-auto md:right-4 md:top-4 md:h-[calc(100vh-2rem)] md:w-[400px] md:rounded-lg md:border md:shadow-lg'
          )}
        >
          <Button
            isIconOnly
            variant="light"
            className="absolute right-2 top-2"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="mt-8 flex-1 overflow-hidden">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
