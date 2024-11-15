import { useState } from 'react';
import { Message as MessageType } from '@/types/chat';
import { Avatar, Button } from '@nextui-org/react';
import { formatRelativeTime } from '@/utils/chat';
import { MediaViewer } from './MediaViewer';
import { Blur } from '@/utils/blurhash';
import { Lock } from 'lucide-react';

interface MessageProps {
  message: MessageType;
  isGrouped?: boolean;
  showAvatar?: boolean;
  onMediaViewed?: (messageId: string) => void;
}

export function Message({ message, isGrouped, showAvatar, onMediaViewed }: MessageProps) {
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  
  const isEphemeral = message.type?.startsWith('ephemeral-');
  const isViewable = !isEphemeral || !message.metadata?.ephemeral?.viewedAt;
  const hasExpired = isEphemeral && message.metadata?.ephemeral?.expiresAt && 
    new Date(message.metadata.ephemeral.expiresAt) <= new Date();

  const renderMediaPreview = () => {
    if (!message.metadata) return null;

    const { thumbnailUrl, blurHash, dimensions } = message.metadata;
    
    if (hasExpired) {
      return (
        <div className="relative w-48 h-48 bg-default-100 rounded-lg flex items-center justify-center">
          <Lock className="w-6 h-6 text-default-500" />
          <span className="text-sm text-default-500 mt-2">Content expired</span>
        </div>
      );
    }

    return (
      <Button
        className="p-0 min-w-0 w-48 h-48 relative overflow-hidden rounded-lg"
        onPress={() => setIsMediaViewerOpen(true)}
      >
        {blurHash ? (
          <Blur
            hash={blurHash}
            width={dimensions?.width || 400}
            height={dimensions?.height || 400}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          thumbnailUrl && (
            <img
              src={thumbnailUrl}
              alt=""
              className="w-full h-full object-cover"
              style={{ filter: isEphemeral ? 'blur(10px)' : 'none' }}
            />
          )
        )}
        {isEphemeral && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <Lock className="w-6 h-6" />
              <span className="text-sm">Tap to view</span>
              {message.metadata.ephemeral?.duration && (
                <span className="text-xs">
                  Available for {message.metadata.ephemeral.duration}s
                </span>
              )}
            </div>
          </div>
        )}
      </Button>
    );
  };

  return (
    <div
      className={`flex gap-2 ${
        isGrouped ? 'mt-1' : 'mt-4'
      }`}
    >
      {showAvatar && (
        <Avatar
          src={message.sender?.avatarUrl}
          name={message.sender?.name}
          size="sm"
        />
      )}
      <div className={`flex flex-col ${showAvatar ? 'ml-2' : 'ml-10'}`}>
        {!isGrouped && (
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">
              {message.sender?.name}
            </span>
            <span className="text-xs text-default-500">
              {formatRelativeTime(message.timestamp)}
            </span>
          </div>
        )}
        <div className="flex flex-col gap-1">
          {message.content && (
            <div className="bg-default-100 rounded-lg px-4 py-2 max-w-md">
              {message.content}
            </div>
          )}
          {(message.type === 'image' || message.type === 'video' || 
            message.type === 'ephemeral-image' || message.type === 'ephemeral-video') && 
            renderMediaPreview()}
        </div>
      </div>

      {isViewable && message.metadata && (
        <MediaViewer
          isOpen={isMediaViewerOpen}
          onClose={() => setIsMediaViewerOpen(false)}
          items={[
            {
              id: message.id,
              type: message.type === 'video' || message.type === 'ephemeral-video' ? 'video' : 'image',
              url: message.metadata.url || '',
              thumbnailUrl: message.metadata.thumbnailUrl,
              blurHash: message.metadata.ephemeral?.blurHash,
              dimensions: message.metadata.dimensions,
              isEphemeral: isEphemeral,
              ephemeralDuration: message.metadata.ephemeral?.duration,
              viewedAt: message.metadata.ephemeral?.viewedAt
            }
          ]}
          onMediaViewed={onMediaViewed}
        />
      )}
    </div>
  );
}
