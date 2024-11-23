import React from "react";
import { ScrollShadow } from "@nextui-org/react";
import { formatDistanceToNow } from 'date-fns';
import { getMessagePreview } from "@/types/chat";
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";
import {ChatAvatar} from "@/components/chat/ChatAvatar";

interface ChatListProps {
  className?: string;
  selectedChatId: string | null;
  onSelectChat: (roomId: string) => void;
}

export default function ChatList({ onSelectChat, selectedChatId, className }: ChatListProps) {
  const { rooms } = useChat();

  return (
    <ScrollShadow className={cn("flex h-full w-full flex-col gap-1 p-1", className)}>
      {rooms.map((room) => {
        const isSelected = room.id === selectedChatId;
        const lastMessageTime = room.lastMessageTimestamp
          ? formatDistanceToNow(room.lastMessageTimestamp, { addSuffix: true })
          : '';

        // Find current user's participant record
        const currentUserParticipant = room.participants.find(p => p.id === room.createdBy);
        const unreadCount = currentUserParticipant?.unreadCount || 0;

        return (
          <button
            key={room.id}
            onClick={() => onSelectChat(room.id)}
            className={cn(
              "flex w-full items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-default-100",
              isSelected ? "bg-default-100" : "",
              "focus:outline-none focus:ring-2 focus:ring-primary/20"
            )}
          >
            <div className="relative">
              <ChatAvatar
                room={room}
                isActive={selectedChatId === room.id}
              />
            </div>

            <div className="flex flex-col flex-grow min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold truncate">
                  {room.type === "group" ? room.metadata?.groupName || room.name : room.participants[0]?.fullName}
                </span>
                {lastMessageTime && (
                  <span className="text-xs text-default-400">{lastMessageTime}</span>
                )}
              </div>
              <span className="text-xs text-default-400 truncate">
                {room.lastMessagePreview}
              </span>
            </div>
          </button>
        );
      })}
    </ScrollShadow>
  );
}
