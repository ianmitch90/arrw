'use client';

import { Badge } from "@heroui/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ChatRoom } from "@/types/chat";

interface ChatAvatarProps {
  room: ChatRoom;
  isActive?: boolean;
}

export function ChatAvatar({ room, isActive }: ChatAvatarProps) {
  const unreadCount = room.participants[0]?.unreadCount || 0;

  // For group chats, use a regular Avatar
  if (room.type === "group") {
    return (
      <UserAvatar
        userId="group"
        src={room.metadata?.groupAvatar}
        name={room.metadata?.groupName || room.name}
        size="lg"
        showPresence={false}
        className="transition-transform"
      />
    );
  }

  // For individual chats, use UserAvatar with presence
  const avatar = (
    <UserAvatar
      userId={room.participants[0]?.id}
      size="lg"
      showPresence
      showVerification
      className="transition-transform"
    />
  );

  if (unreadCount > 0) {
    return (
      <Badge
        content={unreadCount.toString()}
        color="primary"
        size="sm"
        placement="bottom-right"
        className="border-2 border-background"
      >
        {avatar}
      </Badge>
    );
  }

  return avatar;
}
