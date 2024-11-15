'use client';

import React from 'react';
import { Button, ButtonGroup, Tooltip, Progress, Card } from '@nextui-org/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/utils/cn';

interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  duration?: number;
  progress?: number;
}

interface ChapterControlsProps {
  chapters: Chapter[];
  currentChapter: string;
  onChapterChange: (chapterId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
  isLoading?: boolean;
  showProgress?: boolean;
  variant?: 'default' | 'minimal' | 'card';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export function ChapterControls({
  chapters,
  currentChapter,
  onChapterChange,
  onPrevious,
  onNext,
  className,
  isLoading = false,
  showProgress = true,
  variant = 'default',
}: ChapterControlsProps) {
  const currentIndex = chapters.findIndex(chapter => chapter.id === currentChapter);
  const currentChapterData = chapters[currentIndex];
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < chapters.length - 1;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const renderChapterList = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-2"
    >
      {chapters.map((chapter, index) => (
        <motion.div key={chapter.id} variants={itemVariants}>
          <Button
            variant={chapter.id === currentChapter ? 'solid' : 'flat'}
            color={chapter.id === currentChapter ? 'primary' : 'default'}
            className={cn(
              'w-full justify-start px-4',
              chapter.id === currentChapter && 'font-semibold'
            )}
            onPress={() => onChapterChange(chapter.id)}
            startContent={
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-default-100">
                {index + 1}
              </div>
            }
            endContent={
              chapter.duration && (
                <span className="text-xs text-default-500">
                  {formatDuration(chapter.duration)}
                </span>
              )
            }
          >
            <div className="flex flex-col items-start">
              <span>{chapter.title}</span>
              {chapter.subtitle && (
                <span className="text-xs text-default-500">{chapter.subtitle}</span>
              )}
            </div>
          </Button>
          {showProgress && chapter.progress !== undefined && (
            <Progress
              aria-label="Chapter progress"
              size="sm"
              value={chapter.progress}
              className="mt-1"
              color={chapter.id === currentChapter ? 'primary' : 'default'}
            />
          )}
        </motion.div>
      ))}
    </motion.div>
  );

  const renderControls = () => (
    <ButtonGroup className="w-full">
      <Tooltip content="Previous Chapter" delay={500}>
        <Button
          isIconOnly
          isDisabled={!hasPrevious || isLoading}
          onPress={onPrevious}
          className="flex-1"
        >
          <Icon icon="solar:arrow-left-bold" />
        </Button>
      </Tooltip>

      <Button
        isDisabled={isLoading}
        className="flex-grow"
        startContent={
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {currentIndex + 1}/{chapters.length}
            </span>
            <Icon icon="solar:book-bold" />
          </div>
        }
      >
        {currentChapterData?.title}
      </Button>

      <Tooltip content="Next Chapter" delay={500}>
        <Button
          isIconOnly
          isDisabled={!hasNext || isLoading}
          onPress={onNext}
          className="flex-1"
        >
          <Icon icon="solar:arrow-right-bold" />
        </Button>
      </Tooltip>
    </ButtonGroup>
  );

  if (variant === 'minimal') {
    return (
      <div className={cn('w-full', className)}>
        {renderControls()}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('p-4', className)}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              {renderControls()}
              {renderChapterList()}
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {renderControls()}
      {renderChapterList()}
    </div>
  );
}
