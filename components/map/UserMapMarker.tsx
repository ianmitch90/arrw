'use client';

import { useState } from 'react';
import { Marker } from 'react-map-gl';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useChat } from '@/components/contexts/ChatContext';
import { cn } from '@/lib/utils';

interface UserMapMarkerProps {
  user: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
  isCurrentUser?: boolean;
}

export function UserMapMarker({ user, isCurrentUser }: UserMapMarkerProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const router = useRouter();
  const { createRoom } = useChat();

  if (!user.location) return null;

  const handleMessageClick = async () => {
    try {
      const roomId = await createRoom([user.id]);
      const params = new URLSearchParams();
      params.set('chat', 'direct');
      params.set('id', roomId);
      router.push(`/map?${params.toString()}`);
    } catch (error) {
      console.error('Error creating chat room:', error);
    }
  };

  return (
    <Marker
      latitude={user.location.latitude}
      longitude={user.location.longitude}
      anchor="bottom"
      offset={[0, 8]} // Offset to account for the marker wrapper
    >
      <div className="relative group">
        {/* Avatar with pulse effect */}
        <div 
          className="relative cursor-pointer"
          onClick={() => setIsPopupOpen(!isPopupOpen)}
        >
          <div className={cn(
            "absolute -inset-0.5 animate-pulse rounded-full",
            isCurrentUser ? "bg-blue-500/20" : "bg-primary/20"
          )} />
          {isCurrentUser && (
            <div className="absolute -inset-2 animate-ping bg-blue-500/10 rounded-full" />
          )}
          <div className="relative">
            <UserAvatar
              user={user}
              className={cn(
                "w-8 h-8 border-2 transition-transform duration-200",
                isCurrentUser
                  ? "border-blue-500 hover:border-blue-600"
                  : "border-background hover:border-primary",
                "hover:scale-110",
                isPopupOpen && "scale-110",
                isPopupOpen && (isCurrentUser ? "border-blue-600" : "border-primary")
              )}
            />
          </div>
        </div>

        {/* Popup */}
        {isPopupOpen && (
          <div className={cn(
            "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3",
            "bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border",
            isCurrentUser ? "border-blue-500/50" : "border-border/50"
          )}>
            <div className="flex flex-col items-center gap-2">
              <UserAvatar user={user} className="w-12 h-12" />
              <h3 className="font-semibold text-sm">
                {user.fullName}
                {isCurrentUser && " (You)"}
              </h3>
              <div className="flex gap-2 w-full">
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => router.push(`/profile/${user.id}`)}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={handleMessageClick}
                >
                  Message
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Marker>
  );
}
