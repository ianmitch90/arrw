"use client";

import React, { useRef, useEffect } from "react";
import { ScrollShadow, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Avatar } from "@nextui-org/react";
import { MoreVertical, Phone, Video, ArrowLeft } from "lucide-react";
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { format, formatRelative } from "date-fns";

interface ChatWindowProps {
  className?: string;
  onProfileView?: () => void;
  chatId: string;
  onBack: () => void;
}

export default function ChatWindow({ className, onProfileView, chatId, onBack }: ChatWindowProps) {
  const { rooms, messages } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const room = rooms.find(r => r.id === chatId);
  const chatMessages = messages[chatId] || [];

  // Get the other participant for direct chats
  const otherParticipant = room?.type === 'direct' ? room.participants[0] : null;

  const groupMessagesByDate = (messages: any[]) => {
    const groupedMessages: any[] = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const date = format(messageDate, 'yyyy-MM-dd');

      if (date !== currentDate) {
        groupedMessages.push({ date, messages: [message] });
        currentDate = date;
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(message);
      }
    });

    return groupedMessages;
  };

  const sendMessage = (chatId: string, content: string) => {
    // Handle send
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (!room) return null;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="md:hidden"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <Avatar
            src={room.type === 'direct' ? otherParticipant?.avatarUrl : room.metadata?.groupAvatar}
            name={room.type === 'direct' ? otherParticipant?.name : room.metadata?.groupName}
            size="md"
            className="flex-shrink-0"
          />
          <div>
            <h3 className="font-semibold">
              {room.type === 'direct' ? otherParticipant?.name : room.metadata?.groupName}
            </h3>
            <p className="text-sm text-gray-500">
              {room?.lastMessage ? formatRelative(new Date(room.timestamp), new Date()) : 'No messages yet'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            isIconOnly
            variant="light"
            aria-label="Video Call"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            isIconOnly
            variant="light"
            aria-label="Voice Call"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                aria-label="More Options"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="profile"
                onClick={onProfileView}
              >
                View Profile
              </DropdownItem>
              <DropdownItem
                key="mute"
                description="Stop receiving notifications"
              >
                Mute Chat
              </DropdownItem>
              <DropdownItem
                key="block"
                className="text-danger"
                color="danger"
              >
                Block User
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </div>

      {/* Chat Messages */}
      <ScrollShadow
        ref={scrollRef}
        className="flex-grow space-y-6 p-4"
      >
        {groupMessagesByDate(chatMessages).map(group => (
          <div key={group.date} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-gray-500">
                  {format(new Date(group.date), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            {group.messages.map((message: any) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === '1'}
              />
            ))}
          </div>
        ))}
      </ScrollShadow>

      {/* Chat Input */}
      <div className="border-t p-4">
        <ChatInput onSend={(content) => sendMessage(chatId, content)} />
      </div>
    </div>
  );
}
