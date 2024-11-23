'use client';

import { useState } from 'react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import { useChat } from '@/components/contexts/ChatContext';

export default function ChatPage() {
  const [showProfile, setShowProfile] = useState(false);
  const { activeRoom } = useChat();

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full">
      {/* Chat List - Hidden on mobile when chat is open */}
      <div className={`
        w-full max-w-sm border-r
        ${activeRoom ? 'hidden lg:block' : 'block'}
      `}>
        <ChatList
          onRoomSelect={(roomId) => {
            // This will be handled by the ChatContext
          }}
          className="h-full"
        />
      </div>

      {/* Chat Window - Full screen on mobile when chat is open */}
      <div className={`
        flex-1
        ${activeRoom ? 'block' : 'hidden lg:block'}
      `}>
        {activeRoom ? (
          <ChatWindow
            onProfileView={() => setShowProfile(true)}
            className="h-full"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-default-500">Select a chat to start messaging</p>
          </div>
        )}
      </div>

      {/* Profile Sidebar - Only visible on larger screens */}
      {showProfile && (
        <div className="hidden w-80 border-l lg:block">
          {/* We can add a profile component here later */}
          <div className="p-4">
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>
        </div>
      )}
    </div>
  );
}
