"use client";

import { useUser } from "@/components/contexts/UserContext";
import { useChat } from "@/components/contexts/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { AnimatePresence, motion } from "framer-motion";

interface MessagesProps {
  selectedChatId: string | null;
  onSelectChat: (chatId: string | null) => void;
}

export default function Messages({ selectedChatId, onSelectChat }: MessagesProps) {
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
            <ChatList
              onSelectChat={onSelectChat}
              selectedChatId={selectedChatId}
              className="h-full"
            />
          </motion.div>
        ) : (
          <motion.div
            key="chat-window"
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute inset-0 w-full bg-background"
          >
            <ChatWindow
              chatId={selectedChatId}
              className="h-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
