'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollShadow, Avatar, Button, Input, Spinner } from "@nextui-org/react";
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";
import { ArrowLeft, Send } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

interface ChatViewProps {
  chatId: string;
  chatType: string;
}

export function ChatView({ chatId, chatType }: ChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rooms, sendMessage, typingUsers, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = rooms.find(r => r.id === chatId);
  const otherParticipant = room?.participants[0];
  const isTyping = typingUsers[chatId]?.size > 0;

  // Scroll to bottom when new messages arrive or when someone starts typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages, isTyping]);

  const handleBack = () => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('id');
    router.push(`/map?${params.toString()}`);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    stopTyping(chatId); // Stop typing when sending
    await sendMessage(chatId, message.trim());
    setMessage('');
  };

  const handleTyping = useDebouncedCallback(
    (value: string) => {
      if (value.length > 0) {
        startTyping(chatId);
      } else {
        stopTyping(chatId);
      }
    },
    1000,
    { maxWait: 2000 }
  );

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    handleTyping(value);
  };

  if (!room || !otherParticipant) return null;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <Button
          isIconOnly
          variant="light"
          onClick={handleBack}
          className="text-default-500"
        >
          <ArrowLeft size={20} />
        </Button>

        <Avatar
          src={otherParticipant.avatarUrl || undefined}
          name={otherParticipant.fullName || 'User'}
          size="sm"
          isBordered={otherParticipant.isOnline}
          color={otherParticipant.isOnline ? "success" : "default"}
        />

        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold truncate">
            {room.type === "group" ? room.metadata?.groupName || room.name : otherParticipant.fullName}
          </span>
          <span className="text-xs text-default-500">
            {otherParticipant.isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <ScrollShadow className="flex-1 p-4">
        <div className="space-y-4">
          {room.messages?.map((msg, i) => {
            const isLastMessage = i === room.messages!.length - 1;
            const showAvatar = msg.senderId !== room.createdBy && 
              (!room.messages![i + 1] || room.messages![i + 1].senderId !== msg.senderId);

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2 max-w-[80%]",
                  msg.senderId === room.createdBy ? "ml-auto" : "mr-auto"
                )}
              >
                {showAvatar ? (
                  <Avatar
                    src={otherParticipant.avatarUrl || undefined}
                    name={otherParticipant.fullName || 'User'}
                    size="sm"
                    className="mt-auto"
                  />
                ) : (
                  <div className="w-8" /> // Spacer for alignment
                )}
                <div
                  className={cn(
                    "rounded-lg p-3",
                    msg.senderId === room.createdBy
                      ? "bg-primary text-primary-foreground"
                      : "bg-default-100",
                    !showAvatar && msg.senderId !== room.createdBy && "ml-10" // Indent subsequent messages
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 max-w-[80%] mr-auto">
              <Avatar
                src={otherParticipant.avatarUrl || undefined}
                name={otherParticipant.fullName || 'User'}
                size="sm"
                className="mt-auto"
              />
              <div className="bg-default-100 rounded-lg p-3">
                <Spinner size="sm" color="current" />
              </div>
            </div>
          )}

          {/* Invisible element for scrolling */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollShadow>

      {/* Input */}
      <div className="p-4 border-t bg-background/80 backdrop-blur-sm sticky bottom-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            value={message}
            onChange={handleMessageChange}
            onBlur={() => stopTyping(chatId)}
            placeholder="Type a message..."
            size="sm"
            variant="bordered"
            classNames={{
              input: 'text-small',
              inputWrapper: 'h-10'
            }}
          />
          <Button
            isIconOnly
            color="primary"
            type="submit"
            size="lg"
            isDisabled={!message.trim()}
            className="h-10 w-10"
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </div>
  );
}
