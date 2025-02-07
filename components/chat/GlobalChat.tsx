'use client';

import { useUser } from '@/components/contexts/UserContext';
import { useChat } from '@/components/contexts/ChatContext';
import { ScrollShadow } from '@nextui-org/react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { format } from 'date-fns';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  timestamp: number;
  username?: string;
  avatarUrl?: string;
}

interface MessageEvent {
  user: string;
  content: string;
  timestamp: number;
}

interface GroupedMessages {
  date: string;
  messages: ChatMessage[];
}

export default function GlobalChat() {
  const { user } = useUser();
  const { globalMessages: messages, sendGlobalMessage: sendMessage } = useChat();

  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groupedMessages: GroupedMessages[] = [];
    let currentDate = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.timestamp);
      const date = format(messageDate, 'yyyy-MM-dd');

      if (date !== currentDate) {
        groupedMessages.push({ date, messages: [message] });
        currentDate = date;
      } else {
        groupedMessages[groupedMessages.length - 1].messages.push(message);
      }
    });

    return groupedMessages;
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Global Chat</h2>
      </div>

      <ScrollShadow className="flex-grow space-y-6 p-4">
        {groupMessagesByDate(messages).map(group => (
          <div key={group.date} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-2 text-sm text-gray-500">
                  {format(new Date(group.date), 'MMMM d, yyyy')}
                </span>
              </div>
            </div>
            {group.messages.map((message: ChatMessage) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.senderId === user?.id}
              />
            ))}
          </div>
        ))}
      </ScrollShadow>

      <div className="border-t p-4">
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}
