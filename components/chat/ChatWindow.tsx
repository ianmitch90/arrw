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
  const { rooms = [], messages = [] } = useChat();
  
  const room = rooms.find(r => r.id === chatId);
  const chatMessages = messages.filter(m => m.roomId === chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!room) {
    return null;
  }

  return (
    <div className={cn("flex h-full flex-col bg-content1", className)}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-2">
        <ScrollShadow 
          className="flex flex-col gap-1 py-4"
        >
          {chatMessages.map((message, i) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.senderId === 'current-user'}
            />
          ))}
          <div ref={messagesEndRef} />
        </ScrollShadow>
      </div>

      {/* Input */}
      <div className="border-t border-divider p-2">
        <ChatInput chatId={chatId} onSend={scrollToBottom} />
      </div>
    </div>
  );
}
