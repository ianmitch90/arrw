'use client';

import { useState, useMemo } from 'react';
import { Input, Tabs, Tab, Avatar, Badge, ScrollShadow, Listbox, ListboxItem } from '@nextui-org/react';
import { useChat } from '@/components/contexts/ChatContext';
import { cn } from '@/utils/cn';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from "framer-motion";
import ChatWindow from "./ChatWindow";

interface MessagesProps {
  onSelectChat: (chatId: string | null) => void;
  selectedChatId: string | null;
}

export default function Messages({ selectedChatId, onSelectChat }: MessagesProps) {
  const { rooms = [], users = [] } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'inbox' | 'unread'>('inbox');

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const otherUser = room.participants[0];
      const user = users.find(u => u.id === otherUser.id);
      if (!user) return false;

      const searchString = `${user.username} ${room.last_message_preview}`.toLowerCase();
      return searchString.includes(searchQuery.toLowerCase());
    });
  }, [rooms, users, searchQuery]);

  const activeRooms = useMemo(() => {
    if (selectedTab === 'unread') {
      return filteredRooms.filter(room => room.participants[0].unread_count > 0);
    }
    return filteredRooms;
  }, [filteredRooms, selectedTab]);

  return (
    <div className="relative h-full overflow-hidden bg-background">
      <AnimatePresence initial={false} mode="wait">
        {!selectedChatId ? (
          <motion.div
            key="chat-list"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute inset-0 w-full bg-background"
          >
            <div className="h-dvh w-full overflow-visible">
             
              <div className="mb-6 flex flex-col gap-4 px-3 sm:px-6">
                <div>
                  <div className="mb-4 lg:mb-4">
                    <Input
                      aria-label="Search"
                      labelPlacement="outside"
                      placeholder="Search..."
                      radius="md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      startContent={
                        <Search className="text-default-500" size={18} />
                      }
                      variant="bordered"
                    />
                  </div>
                  <div className="mt-4">
                    <Tabs
                      fullWidth
                      selectedKey={selectedTab}
                      onSelectionChange={(key) => setSelectedTab(key as 'inbox' | 'unread')}
                      classNames={{
                        cursor: "group-data-[selected=true]:bg-content1",
                      }}
                    >
                      <Tab key="inbox" title="Inbox" />
                      <Tab key="unread" title="Unread" />
                    </Tabs>
                  </div>
                </div>
              </div>
              <ScrollShadow className="flex h-full max-h-[calc(100vh-196px)] flex-col gap-6 overflow-y-auto px-3">
                <Listbox
                  classNames={{
                    base: "p-0",
                  }}
                  variant="flat"
                >
                  {activeRooms.map((room) => {
                    const otherUser = room.participants[0];
                    const user = users.find((u) => u.id === otherUser.id);
                    if (!user) return null;

                    const unreadCount = otherUser.unread_count;
                    const timestamp = room.last_message_timestamp
                      ? formatDistanceToNow(new Date(room.last_message_timestamp), { addSuffix: true })
                      : '';

                    return (
                      <ListboxItem
                        key={room.id}
                        className={cn("mb-2 px-4", {
                          "bg-default-100": selectedChatId === room.id,
                        })}
                        endContent={<div className="text-small text-default-400">{timestamp}</div>}
                        textValue={user.username}
                        onPress={() => onSelectChat(room.id)}
                      >
                        <div className="flex items-center gap-2 py-1">
                          {unreadCount === 0 ? (
                            <Avatar
                              src={user.profile?.avatar_url}
                              name={user.username}
                              className="flex-shrink-0"
                              size="sm"
                              isBordered={user.profile?.last_active && new Date(user.profile.last_active).getTime() > Date.now() - 1000 * 60 * 5}
                              color={user.profile?.last_active && new Date(user.profile.last_active).getTime() > Date.now() - 1000 * 60 * 5 ? "success" : "default"}
                            />
                          ) : (
                            <Badge color="danger" content={unreadCount}>
                              <Avatar
                                src={user.profile?.avatar_url}
                                name={user.username}
                                className="flex-shrink-0"
                                size="sm"
                                isBordered={user.profile?.last_active && new Date(user.profile.last_active).getTime() > Date.now() - 1000 * 60 * 5}
                                color={user.profile?.last_active && new Date(user.profile.last_active).getTime() > Date.now() - 1000 * 60 * 5 ? "success" : "default"}
                              />
                            </Badge>
                          )}
                          <div className="ml-2 min-w-0 flex-1">
                            <div className="text-small font-semibold text-default-foreground">
                              {user.role === 'anon' ? 'Anonymous Cruiser' : user.username}
                            </div>
                            <div className="truncate text-small text-default-500">
                              {room.last_message_preview}
                            </div>
                          </div>
                        </div>
                      </ListboxItem>
                    );
                  })}
                </Listbox>
              </ScrollShadow>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute inset-0 h-full w-full bg-background"
          >
            <ChatWindow chatId={selectedChatId} onBack={() => onSelectChat(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
