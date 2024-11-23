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
  const { rooms = [], messages = [], sendMessage } = useChat();
  
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

  const handleSendMessage = (content: string) => {
    sendMessage({
      roomId: chatId,
      content,
      senderId: 'current-user',
      type: 'text'
    });
  };

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Messages */}
      <ScrollShadow 
        className="flex-1 overflow-y-auto"
        hideScrollBar
      >
        <div className="flex flex-col gap-3 py-6">
          {chatMessages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwn={message.senderId === 'current-user'}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      {/* Input Area */}
      <div className="flex items-end gap-2 border-t border-divider bg-background p-4">
        <ChatInput
          onSend={handleSendMessage}
          className="flex-1"
        />
      </div>
    </div>
  );
}
