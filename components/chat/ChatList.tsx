'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ScrollShadow, Input, Badge, Spinner } from "@heroui/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { formatDistanceToNow } from 'date-fns';
import { useChat } from "@/components/contexts/ChatContext";
import { cn } from "@/utils/cn";
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';

interface ChatListProps {
  chatType: string;
}

export function ChatList({ chatType }: ChatListProps) {
  const { rooms, typingUsers } = useChat();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rooms based on search query
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const otherParticipant = room.participants[0];
      if (!otherParticipant) return false;

      const searchString = `${otherParticipant.fullName || ''} ${room.lastMessagePreview || ''}`.toLowerCase();
      return searchString.includes(searchQuery.toLowerCase());
    });
  }, [rooms, searchQuery]);

  const handleSelectChat = (roomId: string) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('chat', chatType);
    params.set('id', roomId);
    router.push(`/map?${params.toString()}`);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-xl font-semibold">
          {chatType === 'messages' ? 'Messages' : 'Global Chat'}
        </h2>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search messages..."
          startContent={<Search className="text-default-400" size={20} />}
          size="sm"
          variant="bordered"
          classNames={{
            input: 'text-small',
            inputWrapper: 'h-10'
          }}
        />
      </div>

      {/* Chat List */}
      <ScrollShadow className="flex-1 p-2">
        <div className="space-y-2">
          {filteredRooms.map((room) => {
            const lastMessageTime = room.lastMessageTimestamp
              ? formatDistanceToNow(room.lastMessageTimestamp, { addSuffix: true })
              : '';

            const otherParticipant = room.participants[0];
            const unreadCount = otherParticipant?.unreadCount || 0;

            return (
              <button
                key={room.id}
                onClick={() => handleSelectChat(room.id)}
                className={cn(
                  "flex w-full items-center gap-3 p-3 rounded-lg",
                  "hover:bg-default-100 active:bg-default-200",
                  "transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <UserAvatar
                    userId={otherParticipant?.id}
                    size="md"
                    showPresence
                    showVerification
                    className="transition-transform"
                  />
                </div>

                {/* Content */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold truncate">
                      {room.type === "group" ? room.metadata?.groupName || room.name : otherParticipant?.fullName}
                    </span>
                    <span className="text-xs text-default-400 whitespace-nowrap">
                      {lastMessageTime}
                    </span>
                  </div>

                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-default-400 truncate">
                      {typingUsers[room.id]?.size > 0 ? (
                        <span className="flex items-center gap-2">
                          <Spinner size="sm" color="current" />
                          <span>Typing...</span>
                        </span>
                      ) : (
                        room.lastMessagePreview
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <Badge
                        content={unreadCount}
                        color="primary"
                        size="sm"
                        className="ml-2"
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </ScrollShadow>
    </div>
  );
}
