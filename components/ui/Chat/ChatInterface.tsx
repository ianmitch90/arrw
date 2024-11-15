import { useCallback, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Message } from './Message';
import { MessageInput } from './MessageInput';
import { Message as MessageType } from '@/types/chat';
import { groupMessagesByDate } from '@/utils/chat';

interface ChatInterfaceProps {
  messages: MessageType[];
  onSendMessage: (content: string, type?: MessageType['type'], metadata?: MessageType['metadata']) => void;
  onMediaViewed?: (messageId: string) => void;
}

export function ChatInterface({
  messages,
  onSendMessage,
  onMediaViewed
}: ChatInterfaceProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    if (parentRef.current) {
      const scrollElement = parentRef.current;
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (!parentRef.current) return;
    
    const { scrollHeight, scrollTop, clientHeight } = parentRef.current;
    const newAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    
    if (newAtBottom !== atBottom) {
      setAtBottom(newAtBottom);
    }
  }, [atBottom]);

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div className="flex flex-col h-full">
      <div
        ref={parentRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative'
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow, index) => {
            const message = messages[virtualRow.index];
            
            return (
              <div
                key={virtualRow.key}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                <Message
                  message={message}
                  isGrouped={index > 0}
                  showAvatar={index === 0}
                  onMediaViewed={onMediaViewed}
                />
              </div>
            );
          })}
        </div>
      </div>

      <MessageInput
        onSendMessage={onSendMessage}
        onSendEphemeralMedia={(file, duration) => {
          const reader = new FileReader();
          reader.onload = async (e) => {
            const content = e.target?.result as string;
            const type = file.type.startsWith('image/')
              ? 'ephemeral-image'
              : 'ephemeral-video';

            // In a real app, you'd upload the file to a server and get a URL back
            // You'd also generate the BlurHash on the server
            onSendMessage(content, type, {
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
              thumbnailUrl: content,
              ephemeral: {
                duration,
                blurHash: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj' // Example BlurHash
              }
            });
          };
          reader.readAsDataURL(file);
        }}
      />
    </div>
  );
}
