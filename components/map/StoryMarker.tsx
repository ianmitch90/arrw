import { Story } from '@/types/core';
import { Avatar } from '@nextui-org/react';
import { formatDistanceToNow } from 'date-fns';

interface StoryMarkerProps {
  story: Story;
  onClick: () => void;
}

export function StoryMarker({ story, onClick }: StoryMarkerProps) {
  const timeAgo = formatDistanceToNow(new Date(story.created_at), { addSuffix: true });

  return (
    <div
      className="relative cursor-pointer group"
      onClick={onClick}
    >
      {/* Marker Ring */}
      <div className="absolute -inset-1 bg-primary rounded-full animate-ping" />
      
      {/* Avatar */}
      <Avatar
        size="sm"
        src={story.user.avatar_url}
        name={story.user.full_name}
        className="border-2 border-primary"
      />

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="bg-background/80 backdrop-blur-md px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
          <p className="text-xs font-medium">
            {story.user.full_name}
          </p>
          <p className="text-xs text-default-500">
            {timeAgo}
          </p>
        </div>
      </div>
    </div>
  );
}
