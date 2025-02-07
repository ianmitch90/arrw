'use client';

import React from "react";
import { Avatar } from "@nextui-org/react";
import { formatDistanceToNow } from "date-fns";
import { Message, ChatUser } from "@/types/chat.types";
import { cn } from "@/utils/cn";

interface ChatMessageProps {
  message: Message;
  isSender: boolean;
  className?: string;
}

export function ChatMessage({ message, isSender, className }: ChatMessageProps) {
  const sender: ChatUser = {
    id: message.senderId,
    fullName: `User ${message.senderId}`, // Default to user ID if no name available
    status: 'active',
    avatarUrl: undefined // This will allow the Avatar component to fall back to using the name
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isSender ? "flex-row-reverse" : "flex-row",
        className
      )}
    >
      <Avatar
        className="flex-shrink-0"
        size="sm"
        src={sender.avatarUrl}
        name={sender.fullName}
      />

      <div
        className={cn(
          "flex flex-col gap-1",
          isSender ? "items-end" : "items-start"
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-small text-default-500">
            {sender.fullName}
          </span>
        </div>

        <div
          className={cn(
            "rounded-lg px-3 py-2 text-small",
            isSender
              ? "bg-primary text-primary-foreground"
              : "bg-default-100"
          )}
        >
          {message.messageType === 'system' && (
            <span className="text-tiny text-default-400">
              System: {sender.fullName} {message.content}
            </span>
          )}
          {message.messageType !== 'system' && message.content}
        </div>

        <span className="text-tiny text-default-400">
          {formatDistanceToNow(message.createdAt, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
