'use client';

import { Avatar, Badge } from "@nextui-org/react";
import { ChatRoom } from "@/types/chat";

interface ChatAvatarProps {
  room: ChatRoom;
  isActive?: boolean;
}

export function ChatAvatar({ room, isActive }: ChatAvatarProps) {
  const isOnline = room.participants[0]?.status === "online";
  const unreadCount = room.participants[0]?.unreadCount || 0;

  const avatar = (
    <Avatar
      src={room.type === "group" ? room.metadata?.groupAvatar : room.participants[0]?.avatarUrl}
      name={room.type === "group" ? (room.metadata?.groupName || room.name) : room.participants[0]?.name}
      size="lg"
      isBordered={isOnline}
      color={isOnline ? "success" : undefined}
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
