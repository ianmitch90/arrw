import { useCallback, useMemo } from 'react';
import { Card, CardBody, Avatar, Badge, ScrollShadow } from '@nextui-org/react';
import { ChatRoom as ChatRoomType, ChatUser } from '@/types/chat';

interface ChatRoomProps {
  rooms: ChatRoomType[];
  currentUser: ChatUser;
  selectedRoomId?: string;
  onRoomSelect: (roomId: string) => void;
}

export function ChatRoom({
  rooms,
  currentUser,
  selectedRoomId,
  onRoomSelect
}: ChatRoomProps) {
  const sortedRooms = useMemo(() => {
    return [...rooms].sort((a, b) => {
      // Sort by unread messages first
      if ((a.unreadCount || 0) !== (b.unreadCount || 0)) {
        return (b.unreadCount || 0) - (a.unreadCount || 0);
      }
      // Then by last message time
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }, [rooms]);

  const getOtherParticipant = useCallback(
    (room: ChatRoomType): ChatUser => {
      return room.participants.find((p) => p.id !== currentUser.id) || room.participants[0];
    },
    [currentUser.id]
  );

  const formatLastSeen = (date?: Date): string => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollShadow className="h-full">
      <div className="space-y-2 p-2">
        {sortedRooms.map((room) => {
          const otherUser = getOtherParticipant(room);
          const isSelected = room.id === selectedRoomId;
          
          return (
            <Card
              key={room.id}
              isPressable
              isHoverable
              className={`transition-colors ${
                isSelected ? 'bg-primary/10' : ''
              }`}
              onPress={() => onRoomSelect(room.id)}
            >
              <CardBody className="flex flex-row items-center gap-3 py-2">
                <div className="relative">
                  <Avatar
                    src={otherUser.avatarUrl}
                    className="w-10 h-10"
                    isBordered={otherUser.status === 'online'}
                    color={otherUser.status === 'online' ? 'success' : 'default'}
                  />
                  {room.unreadCount ? (
                    <Badge
                      content={room.unreadCount}
                      color="danger"
                      placement="top-right"
                      className="absolute -top-2 -right-2"
                    />
                  ) : null}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold truncate">{otherUser.name}</p>
                    <span className="text-xs text-default-500">
                      {formatLastSeen(otherUser.lastSeen)}
                    </span>
                  </div>
                  {room.lastMessage && (
                    <p className="text-sm text-default-500 truncate">
                      {room.lastMessage.content}
                    </p>
                  )}
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </ScrollShadow>
  );
}
