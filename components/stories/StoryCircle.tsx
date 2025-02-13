import { Story } from '@/types/core';
import { Avatar } from '@heroui/react';
import { formatDistanceToNow } from 'date-fns';

interface StoryCircleProps {
  story: Story;
  onPress: () => void;
}

export function StoryCircle({ story, onPress }: StoryCircleProps) {
  const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: true });
  const hasExpired = story.expiresAt < new Date();

  return (
    <button
      onClick={onPress}
      className="flex flex-col items-center gap-1 min-w-[72px]"
      disabled={hasExpired}
    >
      <div className={`p-0.5 rounded-full ${hasExpired ? 'bg-gray-300' : 'bg-primary'}`}>
        <Avatar
          src={story.content.thumbnailUrl}
          className={`w-12 h-12 ${hasExpired ? 'opacity-50' : ''}`}
          isBordered={!hasExpired}
        />
      </div>
      <span className="text-xs truncate max-w-full">
        {timeAgo}
      </span>
    </button>
  );
}
