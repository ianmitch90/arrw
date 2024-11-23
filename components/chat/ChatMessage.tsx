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
  
  // Find the sender in the room's participants
  const sender = (rooms ?? [])
    .flatMap(room => room.participants ?? [])
    .find((p: ChatUser) => p.id === message.senderId) || {
      id: message.senderId,
      name: 'Unknown User',
      avatarUrl: undefined,
      status: 'offline' as const,
      lastSeen: new Date()
    };

  return (
    <div
      className={cn(
        'flex gap-3',
        isOwn ? 'flex-row-reverse' : 'flex-row',
        className
      )}
    >
      <Avatar
        src={sender?.avatarUrl}
        name={sender?.name || 'User'}
        size="sm"
        className="flex-shrink-0"
      />

      <div
        className={cn(
          'group relative max-w-[80%] rounded-lg px-3 py-2',
          isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="break-words">{message.content}</p>
        <span
          className={cn(
            'absolute -bottom-5 text-xs text-gray-500',
            isOwn ? 'right-0' : 'left-0'
          )}
        >
          {format(new Date(message.timestamp), 'HH:mm')}
        </span>
      </div>
    </div>
  );
}
