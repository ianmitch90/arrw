'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button, Input, Spinner, Avatar } from "@heroui/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";
import { ArrowLeft, Send, Phone, Video, MoreVertical, Plus, Smile } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { ChatBubble } from '@/components/ui/chat/chat-bubble';
import { ChatInput } from '@/components/ui/chat/chat-input';
import { ChatMessageList } from '@/components/ui/chat/chat-message-list';
import { useAutoScroll } from '@/components/ui/chat/hooks/useAutoScroll';

interface ChatViewProps {
  chatId: string;
  chatType: string;
}

export function ChatView({ chatId, chatType }: ChatViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rooms, sendMessage, typingUsers, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const isNewChat = room?.messages?.length === 0;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = rooms.find(r => r.id === chatId);
  const otherParticipant = room?.participants[0];
  const isTyping = typingUsers[chatId]?.size > 0;

  // Scroll to bottom when new messages arrive or when someone starts typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.messages, isTyping]);

  // Auto-focus input for new chats
  useEffect(() => {
    if (inputRef.current && isNewChat) {
      inputRef.current.focus();
    }
  }, [isNewChat]);

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

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2">
            <UserAvatar
              userId={otherParticipant.id}
              size="sm"
              showPresence
              showVerification
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
        </div>

        <div className="flex items-center gap-2">
          <Button isIconOnly variant="light" className="text-default-500">
            <Phone size={20} />
          </Button>
          <Button isIconOnly variant="light" className="text-default-500">
            <Video size={20} />
          </Button>
          <Button isIconOnly variant="light" className="text-default-500">
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ChatMessageList className="flex-1">
        <div className="space-y-4 max-w-[95%] mx-auto" ref={messagesEndRef}>
          {(room.messages || []).map((msg, i) => {
            const isLastMessage = i === (room.messages || []).length - 1;
            const showAvatar = msg.senderId !== room.createdBy && 
              (!(room.messages || [])[i + 1] || (room.messages || [])[i + 1].senderId !== msg.senderId);
            const isCurrentUser = msg.senderId === room.createdBy;

            return (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-2",
                  isCurrentUser ? "justify-end" : "justify-start"
                )}
              >
                {!isCurrentUser && showAvatar && (
                  <Avatar
                    src={otherParticipant.avatarUrl}
                    name={otherParticipant.fullName || 'User'}
                    size="sm"
                    className="mt-auto"
                    fallback={otherParticipant.fullName?.[0] || 'U'}
                  />
                )}
                <ChatBubble
                  variant={isCurrentUser ? "sent" : "received"}
                  className={!showAvatar && !isCurrentUser ? "ml-10" : ""}
                >
                  <div className={cn(
                    "rounded-lg p-3",
                    isCurrentUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                </ChatBubble>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <Avatar
                src={otherParticipant.avatarUrl || undefined}
                name={otherParticipant.fullName || 'User'}
                size="sm"
                className="mt-auto"
              />
              <div className="bg-muted rounded-lg rounded-bl-none p-3">
                <Spinner size="sm" color="current" />
              </div>
            </div>
          )}
        </div>
      </ChatMessageList>

      {/* Input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm sticky bottom-0">
        {isNewChat && (
          <p className="text-xs text-muted-foreground mb-2 text-center">Start a new conversation...</p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 items-center max-w-[95%] mx-auto"
        >
          <Button isIconOnly variant="light" className="text-default-500">
            <Plus size={20} />
          </Button>
          <ChatInput
            value={message}
            ref={inputRef}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping(e.target.value);
            }}
            onBlur={() => stopTyping(chatId)}
            placeholder="Type a message..."
            className="flex-1 min-h-[40px] max-h-[120px]"
            rows={1}
          />
          <Button isIconOnly variant="light" className="text-default-500">
            <Smile size={20} />
          </Button>
          <Button
            isIconOnly
            type="submit"
            variant="light"
            className="text-default-500"
            isDisabled={!message.trim()}
          >
            <Send size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
}
