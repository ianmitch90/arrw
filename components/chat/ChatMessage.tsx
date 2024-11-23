'use client';

import { cn } from '@/utils/cn';
import { Message as MessageType, ChatUser } from '@/types/chat';
import { Avatar } from '@nextui-org/react';
import { format } from 'date-fns';
import { useChat } from '@/components/contexts/ChatContext';

interface ChatMessageProps {
  message: MessageType;
  isOwn: boolean;
  className?: string;
}

export function ChatMessage({ message, isOwn, className }: ChatMessageProps) {
  const { rooms = [] } = useChat();
  
  const sender = (rooms ?? [])
    .flatMap(room => room.participants ?? [])
    .find((p: ChatUser) => p.id === message.senderId) || {
      id: message.senderId,
      name: 'Unknown User',
      avatarUrl: undefined,
      status: 'offline' as const,
      lastSeen: new Date()
    };

  const MessageAvatar = () => (
    <div className="relative flex-none">
      <Avatar
        src={sender?.avatarUrl}
        name={sender?.name || 'User'}
        size="sm"
        className="transition-transform"
      />
    </div>
  );

  const MessageContent = () => (
    <div className={cn(
      "flex max-w-[75%] flex-col gap-1",
      isOwn ? "items-end" : "items-start"
    )}>
      <div className={cn(
        "relative w-auto rounded-lg px-4 py-2",
        isOwn ? "bg-primary text-primary-foreground" : "bg-default-100",
        "shadow-small"
      )}>
        <div className="flex items-end gap-2">
          {!isOwn && (
            <span className="text-tiny font-semibold text-default-600">
              {sender.name}
            </span>
          )}
          <span className="text-tiny text-default-400 min-w-[48px] text-right">
            {format(new Date(message.timestamp), 'HH:mm')}
          </span>
        </div>
        <div className={cn(
          "mt-1 text-small break-words",
          isOwn ? "text-primary-foreground" : "text-default-700"
        )}>
          {message.content}
          {message.type === 'image' && message.metadata?.thumbnailUrl && (
            <img
              alt={`Image sent by ${sender.name}`}
              className="mt-2 rounded-lg border border-default-200 shadow-small"
              src={message.metadata.thumbnailUrl}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(
      "flex w-full gap-2 px-4 py-2",
      isOwn ? "flex-row-reverse" : "flex-row",
      className
    )}>
      {!isOwn && <MessageAvatar />}
      <MessageContent />
    </div>
  );
}
