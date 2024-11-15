'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface FormErrorProps {
  message?: string | string[];
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'subtle';
}

const errorAnimation = {
  initial: { opacity: 0, y: -10, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -10, height: 0 }
};

export default function FormError({
  message,
  className,
  showIcon = true,
  variant = 'default'
}: FormErrorProps) {
  if (!message) return null;

  const messages = Array.isArray(message) ? message : [message];
  if (messages.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={messages.join(',')} // Force re-render on message change
        variants={errorAnimation}
        initial="initial"
        animate="animate"
        exit="exit"
        className={cn(
          'w-full',
          className
        )}
      >
        {messages.map((msg, index) => (
          <div
            key={`${msg}-${index}`}
            className={cn(
              'flex items-start gap-2 text-sm',
              variant === 'default' ? 'text-danger' : 'text-danger-500/80',
              messages.length > 1 && index < messages.length - 1 && 'mb-1'
            )}
          >
            {showIcon && (
              <Icon
                icon="solar:danger-triangle-bold"
                className={cn(
                  'flex-shrink-0 mt-0.5',
                  variant === 'default' ? 'text-danger' : 'text-danger-500/80'
                )}
              />
            )}
            <span className="leading-tight">{msg}</span>
          </div>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

// Helper function to extract Formik error message
export function getFormErrorMessage(touched: boolean | undefined, error: string | undefined): string | undefined {
  return touched && error ? error : undefined;
}
