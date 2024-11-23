"use client";

import React, { useRef, useEffect } from "react";
import { ScrollShadow } from "@nextui-org/react";
import { cn } from "@/utils/cn";
import { useChat } from "@/components/contexts/ChatContext";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatWindowProps {
  chatId: string;
  onBack?: () => void;
  className?: string;
}

export default function ChatWindow({ chatId, onBack, className }: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { rooms, sendMessage, markAsRead } = useChat();
  const room = rooms.find(r => r.id === chatId);

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
    try {
      await sendMessage(chatId, content);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <ScrollShadow 
        className="flex-1 overflow-y-auto"
        hideScrollBar
      >
        <div className="flex flex-col gap-3 py-6">
          {room.messages?.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isSender={message.senderId === room.createdBy}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
}
