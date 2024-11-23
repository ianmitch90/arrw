"use client";

import React from "react";
import {Button, Chip} from "@nextui-org/react";
import {Menu} from "lucide-react";
import {cn} from "@/utils/cn";
import { useChat } from "@/components/contexts/ChatContext";

export interface MessagingChatHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpen?: () => void;
}

export const MessagingChatHeader = React.forwardRef<
  HTMLDivElement,
  MessagingChatHeaderProps
>(({ className, onOpen, ...props }, ref) => {
  const { rooms } = useChat();
  const totalUnread = rooms.reduce((total, room) => {
    const currentUserParticipant = room.participants.find(p => p.id === room.createdBy);
    return total + (currentUserParticipant?.unreadCount || 0);
  }, 0);

  return (
    <header
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-base font-medium">Chats</h1>
        {totalUnread > 0 && (
          <Chip
            variant="flat"
            className="h-[18px] border-1 border-default-200 px-1"
            size="sm"
          >
            {totalUnread}
          </Chip>
        )}
      </div>
    </header>
  );
});

MessagingChatHeader.displayName = "MessagingChatHeader";

export default MessagingChatHeader;
