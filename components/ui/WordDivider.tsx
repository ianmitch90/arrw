'use client';

import React from 'react';
import { Divider } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface WordDividerProps {
  word: string;
  className?: string;
  wordClassName?: string;
  lineClassName?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const spacingMap = {
  sm: 'gap-2 py-1',
  md: 'gap-4 py-2',
  lg: 'gap-6 py-3'
};

export default function WordDivider({
  word,
  className,
  wordClassName,
  lineClassName,
  orientation = 'horizontal',
  spacing = 'md',
  animate = true
}: WordDividerProps) {
  const content = (
    <div
      className={cn(
        'flex items-center',
        spacingMap[spacing],
        orientation === 'vertical' && 'flex-col',
        className
      )}
    >
      <Divider
        className={cn(
          'flex-1',
          orientation === 'vertical' && '!w-px h-full',
          lineClassName
        )}
      />
      <p
        className={cn(
          'shrink-0 text-tiny text-default-500 font-medium',
          wordClassName
        )}
      >
        {word}
      </p>
      <Divider
        className={cn(
          'flex-1',
          orientation === 'vertical' && '!w-px h-full',
          lineClassName
        )}
      />
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30
      }}
    >
      {content}
    </motion.div>
  );
}
