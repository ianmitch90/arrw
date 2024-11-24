import { useState, useEffect } from 'react';
import { StoryViewerProps } from '@/types/map';
import { Modal, ModalContent, Button } from '@nextui-org/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

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

  const renderContent = () => {
    const { type, url, thumbnail_url } = story.story_content;
    if (type === 'image') {
      return (
        <img
          src={url}
          alt="Story content"
          className="w-full h-full object-contain"
          loading="eager"
        />
      );
    }
    return (
      <div className="p-4 text-white">
        <p>{url}</p>
      </div>
    );
  };

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

          {/* Close Button */}
          <Button
            isIconOnly
            variant="light"
            className="absolute top-4 right-4 z-10"
            onPress={onClose}
          >
            <X className="w-4 h-4" />
          </Button>

          {/* Story Content */}
          <div className="h-full flex items-center justify-center">
            {renderContent()}
          </div>

          {/* User Info */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
            <img
              src={story.user.avatar_url}
              alt={story.user.full_name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <p className="text-white font-medium">{story.user.full_name}</p>
              <p className="text-white/70 text-sm">
                {formatDistanceToNow(new Date(story.created_at || ''), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
