'use client';

import { useState } from 'react';
import { ChatProvider } from '@/components/contexts/ChatContext';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { AnimatePresence, motion } from 'framer-motion';

function MessagesContent() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="relative h-[calc(100vh-4rem)] overflow-hidden bg-background">
      <AnimatePresence initial={false} mode="wait">
        {!selectedChat ? (
          <motion.div
            key="chat-list"
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute inset-0 w-full bg-background"
          >
            <ChatList
              onSelectChat={setSelectedChat}
              selectedChatId={selectedChat}
              className="h-full"
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="absolute inset-0 w-full bg-background"
          >
            <ChatWindow
              chatId={selectedChat}
              onBack={() => setSelectedChat(null)}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <ChatProvider>
      <MessagesContent />
    </ChatProvider>
  );
}
