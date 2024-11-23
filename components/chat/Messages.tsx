"use client";

import { useUser } from "@/components/contexts/UserContext";
import { useChat } from "@/components/contexts/ChatContext";
import ChatList from "./ChatList";
import ChatWindow from "./ChatWindow";
import { useState } from "react";

export default function Messages() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  return (
    <div className="flex h-full gap-4">
      {/* Chat List - hidden on mobile when chat is selected */}
      <div className={`w-full md:w-80 flex-shrink-0 ${selectedChat ? 'hidden md:block' : ''}`}>
        <ChatList onSelectChat={setSelectedChat} selectedChatId={selectedChat} />
      </div>

      {/* Chat Window - hidden on mobile when no chat is selected */}
      <div className={`flex-grow ${!selectedChat ? 'hidden md:block' : ''}`}>
        {selectedChat ? (
          <ChatWindow chatId={selectedChat} onBack={() => setSelectedChat(null)} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
