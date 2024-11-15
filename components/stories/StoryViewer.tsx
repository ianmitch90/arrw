import { useState, useEffect } from 'react';
import { Story } from '@/types/core';
import { Modal, ModalContent, Button } from '@nextui-org/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface StoryViewerProps {
  story: Story;
  onClose: () => void;
}

export function StoryViewer({ story, onClose }: StoryViewerProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds per story
    const interval = 50; // Update progress every 50ms
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return prev;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <Modal
      isOpen
      onClose={onClose}
      hideCloseButton
      className="bg-transparent"
      size="full"
      classNames={{
        wrapper: 'p-0',
        base: 'h-screen m-0'
      }}
    >
      <ModalContent>
        <div className="relative h-full bg-black">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20">
            <div
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <img
                src={story.user.avatar_url}
                alt={story.user.full_name}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <p className="text-sm font-medium">
                  {story.user.full_name}
                </p>
                <p className="text-xs opacity-75">
                  {formatDistanceToNow(new Date(story.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              onPress={onClose}
              className="text-white"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Story Content */}
          <div className="h-full flex items-center justify-center">
            {story.content.type === 'image' ? (
              <img
                src={story.content.url}
                alt="Story"
                className="max-h-full w-auto object-contain"
              />
            ) : story.content.type === 'video' && (
              <video
                src={story.content.url}
                autoPlay
                playsInline
                muted
                loop
                className="max-h-full w-auto object-contain"
                poster={story.content.thumbnail_url}
              />
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none">
            <Button
              isIconOnly
              variant="light"
              className="text-white pointer-events-auto"
              onPress={() => {/* TODO: Previous story */}}
            >
              <ChevronLeft />
            </Button>
            <Button
              isIconOnly
              variant="light"
              className="text-white pointer-events-auto"
              onPress={() => {/* TODO: Next story */}}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
