"use client";

import React from "react";
import { ScrollShadow, Avatar, Badge } from "@nextui-org/react";
import { formatRelativeTime } from "@/utils/chat";
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";

interface ChatListProps {
  className?: string;
  selectedChatId: string | null;
  onSelectChat: (roomId: string) => void;
}

export default function ChatList({ onSelectChat, selectedChatId, className }: ChatListProps) {
  const { rooms, activeRoom } = useChat();

  return (
    <ScrollShadow className={cn("flex h-full w-full flex-col gap-1 p-1", className)}>
      {rooms.map((room) => (
        <button
          key={room.id}
          onClick={() => onSelectChat(room.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all",
            selectedChatId === room.id
              ? "bg-primary text-primary-foreground"
              : "hover:bg-default-100",
            activeRoom === room.id && "bg-default-100",
            "focus:outline-none focus:ring-2 focus:ring-primary/20"
          )}
        >
          <div className="relative">
            {room.type === "group" ? (
              <Avatar
                src={room.metadata?.groupAvatar}
                name={room.metadata?.groupName || room.name}
                size="lg"
                isBordered={activeRoom === room.id}
              />
            ) : (
              <Avatar
                src={room.participants[0]?.avatarUrl}
                name={room.participants[0]?.name}
                size="lg"
                isBordered={activeRoom === room.id}
              />
            )}
            {room.participants[0]?.status === "online" && (
              <Badge
                isOneChar
                content=""
                color="success"
                placement="bottom-right"
                className="border-2 border-background"
              />
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <span className="text-small font-semibold">
                {room.type === "group" ? room.metadata?.groupName : room.participants[0]?.name}
              </span>
              {room.lastMessage && (
                <span className="text-tiny text-default-400">
                  {formatRelativeTime(room.lastMessage.timestamp)}
                </span>
              )}
            </div>
            {room.lastMessage && (
              <p className="truncate text-tiny text-default-400">
                {room.lastMessage.content}
              </p>
            )}
          </div>

          {room.unreadCount > 0 && (
            <Badge
              content={room.unreadCount}
              color="primary"
              shape="circle"
              size="sm"
            />
          )}
        </button>
      ))}
    </ScrollShadow>
  );
}
