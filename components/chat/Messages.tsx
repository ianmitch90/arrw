'use client';

import { useState, useMemo, useCallback } from 'react';
import { Input, Tabs, Tab, Avatar, Badge, ScrollShadow, Listbox, ListboxItem } from '@heroui/react';
import { useChat } from '@/components/contexts/ChatContext';
import { cn } from '@/utils/cn';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from "framer-motion";
import { ChatRoom } from '@/types/chat';

interface MessagesProps {
  onSelectChat: (chatId: string | null) => void;
  selectedChatId: string | null;
}

export default function Messages({ selectedChatId, onSelectChat }: MessagesProps) {
  const { rooms = [] } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'unread'>('inbox');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleTabChange = useCallback((key: string | number) => {
    setSelectedTab(key as 'inbox' | 'unread');
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const otherParticipant = room.participants[0];
      if (!otherParticipant) return false;

      const searchString = `${otherParticipant.fullName || ''} ${room.lastMessagePreview || ''}`.toLowerCase();
      return searchString.includes(searchQuery.toLowerCase());
    });
  }, [rooms, searchQuery]);

  const activeRooms = useMemo(() => {
    if (selectedTab === 'unread') {
      return filteredRooms.filter(room => room.participants[0]?.unreadCount > 0);
    }
    return filteredRooms;
  }, [filteredRooms, selectedTab]);

  const renderListItem = useCallback((room: ChatRoom) => {
    const otherParticipant = room.participants[0];
    if (!otherParticipant) return null;

    const unreadCount = otherParticipant.unreadCount;
    const timestamp = room.lastMessageTimestamp
      ? formatDistanceToNow(new Date(room.lastMessageTimestamp), { addSuffix: true })
      : '';
    
    const isOnline = otherParticipant.lastSeen && 
      new Date(otherParticipant.lastSeen).getTime() > Date.now() - 1000 * 60 * 5;

    return (
      <ListboxItem
        key={room.id}
        className={cn("mb-2 px-4", {
          "bg-default-100": selectedChatId === room.id,
        })}
        endContent={<div className="text-small text-default-400">{timestamp}</div>}
        textValue={otherParticipant.fullName || ''}
        onPress={() => onSelectChat(room.id)}
      >
        <div className="flex items-center gap-2 py-1">
          {unreadCount === 0 ? (
            <Avatar
              src={otherParticipant.avatarUrl}
              name={otherParticipant.fullName || ''}
              className="flex-shrink-0"
              size="sm"
              isBordered={isOnline}
              color={isOnline ? "success" : "default"}
            />
          ) : (
            <Badge color="danger" content={unreadCount}>
              <Avatar
                src={otherParticipant.avatarUrl}
                name={otherParticipant.fullName || ''}
                className="flex-shrink-0"
                size="sm"
                isBordered={isOnline}
                color={isOnline ? "success" : "default"}
              />
            </Badge>
          )}
          <div className="ml-2 min-w-0 flex-1">
            <div className="text-small font-semibold text-default-foreground">
              {otherParticipant.role === 'member' ? 'Anonymous Cruiser' : otherParticipant.fullName}
            </div>
            <div className="truncate text-small text-default-500">
              {room.lastMessagePreview}
            </div>
          </div>
        </div>
      </ListboxItem>
    );
  }, [selectedChatId, onSelectChat]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="flex h-full flex-col"
      >
        <div className="flex flex-col">
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-default-400" />
              <Input
                classNames={{
                  input: "pl-10",
                }}
                placeholder="Search messages..."
                size="sm"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <div className="px-4">
            <Tabs
              selectedKey={selectedTab}
              onSelectionChange={handleTabChange}
              variant="light"
              size="sm"
              className="w-full"
            >
              <Tab key="inbox" title="Inbox" />
              <Tab key="unread" title="Unread" />
            </Tabs>
          </div>
        </div>
        <ScrollShadow className="flex h-full max-h-[calc(100vh-196px)] flex-col gap-6 overflow-y-auto px-3">
          <Listbox
            aria-label="Select a Message"
            classNames={{
              base: "p-0",
            }}
            variant="flat"
          >
            {activeRooms.map(renderListItem).filter((item): item is JSX.Element => item !== null)}
          </Listbox>
        </ScrollShadow>
      </motion.div>
    </AnimatePresence>
  );
}
