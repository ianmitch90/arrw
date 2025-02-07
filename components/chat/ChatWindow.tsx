"use client";

import React, { useRef, useEffect } from "react";
import { ScrollShadow } from "@nextui-org/react";
import { cn } from "@/utils/cn";
import { useChat } from "@/components/contexts/ChatContext";
import { useAuth } from "@/lib/auth/AuthContext"; // Import the AuthContext
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import type { Message, ChatRoom } from '@/types/chat.types';

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
  className?: string;
}

export default function ChatWindow({ chatId, onBack, className }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { rooms, sendMessage, markAsRead } = useChat();
  const { user } = useAuth(); // Get the current user from the AuthContext
  const room: ChatRoom | undefined = rooms.find(r => r.id === chatId);
  const messages = room?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (room) {
      markAsRead(room.id);
    }
    scrollToBottom();
  }, [room, markAsRead]);

  if (!room) {
    return null;
  }

  const handleSendMessage = async (content: string) => {
    if (!user) {
      console.error('Cannot send message: No user logged in');
      return;
    }

    try {
      const now = new Date();
      await sendMessage({
        roomId: chatId,
        content,
        senderId: user.id,
        messageType: 'text',
        createdAt: now,
        updatedAt: now,
        isEdited: false
      });
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <ScrollShadow className="flex-1 overflow-y-auto" hideScrollBar>
        <div className="flex flex-col gap-3 py-6">
          {messages.map((message) => {
            const messageWithDefaults = {
              ...message,
              messageType: message.messageType || 'text',
              createdAt: message.createdAt instanceof Date ? message.createdAt : new Date(message.createdAt),
              updatedAt: message.updatedAt instanceof Date ? message.updatedAt : new Date(message.updatedAt || message.createdAt),
              isEdited: message.isEdited || false
            };
            return (
              <ChatMessage
                key={message.id}
                message={messageWithDefaults}
                isSender={user?.id === message.senderId}
              />
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      <ChatInput onSend={handleSendMessage} />
    </div>
  );
}
