import { useEffect, useState, useRef } from 'react';
import { Modal, ModalContent, ModalBody, Button, Progress } from '@nextui-org/react';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { MediaViewerItem } from '@/types/chat';
import { motion, AnimatePresence } from 'framer-motion';

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  items: MediaViewerItem[];
  initialIndex?: number;
  onMediaViewed?: (itemId: string) => void;
}

export function MediaViewer({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  onMediaViewed
}: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout>();

  const currentItem = items[currentIndex];

  useEffect(() => {
    if (isOpen && currentItem?.isEphemeral && !currentItem.viewedAt) {
      onMediaViewed?.(currentItem.id);
      if (currentItem.ephemeralDuration) {
        setTimeRemaining(currentItem.ephemeralDuration);
        startTimer(currentItem.ephemeralDuration);
      }
    }
  }, [isOpen, currentItem, onMediaViewed]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startTimer = (duration: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    setTimeRemaining(duration);
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          onClose();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const renderMedia = () => {
    if (!currentItem) return null;

    if (currentItem.type === 'video') {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={currentItem.url}
            className="max-h-full max-w-full object-contain"
            controls={!currentItem.isEphemeral}
            playsInline
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          {currentItem.isEphemeral && (
            <Button
              isIconOnly
              className="absolute bottom-4 left-1/2 -translate-x-1/2"
              variant="flat"
              onPress={togglePlayPause}
            >
              {isPlaying ? <Pause /> : <Play />}
            </Button>
          )}
        </div>
      );
    }

    return (
      <img
        src={currentItem.url}
        alt=""
        className="max-h-full max-w-full object-contain"
      />
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      classNames={{
        wrapper: 'bg-background/95 backdrop-blur-md',
        base: 'bg-transparent shadow-none max-w-full m-0',
        body: 'p-0 h-screen'
      }}
    >
      <ModalContent>
        <ModalBody>
          <div className="absolute top-0 left-0 right-0 z-50 p-4 flex justify-between items-center">
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
            >
              <X />
            </Button>
            {timeRemaining !== null && (
              <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <Progress
                  size="sm"
                  value={(timeRemaining / (currentItem?.ephemeralDuration || 1)) * 100}
                  className="max-w-[100px]"
                />
                <span className="text-sm">{timeRemaining}s</span>
              </div>
            )}
          </div>

          <div className="h-full flex items-center justify-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentItem?.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                {renderMedia()}
              </motion.div>
            </AnimatePresence>

            {items.length > 1 && (
              <>
                <Button
                  isIconOnly
                  className="absolute left-4"
                  variant="light"
                  isDisabled={currentIndex === 0}
                  onPress={handlePrevious}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  isIconOnly
                  className="absolute right-4"
                  variant="light"
                  isDisabled={currentIndex === items.length - 1}
                  onPress={handleNext}
                >
                  <ChevronRight />
                </Button>
              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
