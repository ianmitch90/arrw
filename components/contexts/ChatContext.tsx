'use client';

import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext<{
  messages: any[]; // Specify the correct type if known
  setMessages: React.Dispatch<React.SetStateAction<any[]>>;
  chatRooms: any[]; // Specify the correct type if known
  setChatRooms: React.Dispatch<React.SetStateAction<any[]>>;
} | null>(null); // Allow null for initial context

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [messages, setMessages] = useState<any[]>([]); // Specify type as any[]
  const [chatRooms, setChatRooms] = useState<any[]>([]); // Specify type as any[]

  return (
    <ChatContext.Provider
      value={{ messages, setMessages, chatRooms, setChatRooms }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
