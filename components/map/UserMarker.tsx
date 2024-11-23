'use client';

import { Avatar } from "@nextui-org/react";
import { Marker } from "react-map-gl";
import { UserProfile } from "@/types/core";

interface UserMarkerProps {
  user: UserProfile;
  isCurrentUser?: boolean;
  onClick?: () => void;
}

export function UserMarker({ user, isCurrentUser = false, onClick }: UserMarkerProps) {
  if (!user.latitude || !user.longitude) return null;

  return (
    <Marker
      latitude={user.latitude}
      longitude={user.longitude}
      anchor="bottom"
      onClick={onClick}
    >
      <div className="relative cursor-pointer transform transition-transform hover:scale-110">
        <Avatar
          src={user.profile_picture_url || undefined}
          name={user.displayName || user.username}
          size="sm"
          isBordered
          color={isCurrentUser ? "primary" : user.status === "online" ? "success" : undefined}
          className="w-10 h-10 text-tiny"
        />
        {/* Presence indicator */}
        <span 
          className={`absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full ${
            isCurrentUser 
              ? "bg-primary" 
              : user.status === "online" 
                ? "bg-success" 
                : "bg-default-300"
          }`}
        />
        {/* Marker pointer */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
          <div className={`w-2 h-2 rotate-45 transform ${
            isCurrentUser 
              ? "bg-primary" 
              : user.status === "online" 
                ? "bg-success" 
                : "bg-default-300"
          }`} />
        </div>
      </div>
    </Marker>
  );
}
