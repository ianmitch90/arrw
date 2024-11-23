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
  
  // Find the sender from the room's participants
  const room = rooms.find(r => r.id === message.roomId);
  const sender = room?.participants.find(p => p.id === message.senderId) || {
    id: message.senderId,
    name: message.senderId === 'current-user' ? 'You' : 'Unknown User',
    avatarUrl: undefined,
    status: 'offline' as const,
    lastSeen: new Date()
  };

  return (
    <div
      className={cn(
        "group flex w-full items-start gap-2 px-4",
        isOwn && "justify-end",
        className
      )}
    >
      {!isOwn && (
        <Avatar
          src={sender.avatarUrl}
          name={sender.name}
          size="sm"
          className="mt-1 flex-none"
        />
      )}
      
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1",
          isOwn ? "items-end" : "items-start"
        )}
      >
        {!isOwn && (
          <span className="px-2 text-tiny text-default-500">
            {sender.name}
          </span>
        )}
        
        <div
          className={cn(
            "relative rounded-xl px-4 py-2",
            isOwn 
              ? "bg-primary text-primary-foreground" 
              : "bg-default-100 text-default-700",
            "shadow-small"
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm">
            {message.content}
            {message.type === 'image' && message.metadata?.thumbnailUrl && (
              <img
                alt={`Image sent by ${sender.name}`}
                className="mt-2 rounded-lg border border-default-200 shadow-small"
                src={message.metadata.thumbnailUrl}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            )}
          </p>
        </div>
        
        <span className="px-2 text-tiny text-default-400">
          {format(new Date(message.timestamp), 'p')}
        </span>
      </div>
    </div>
  );
}
