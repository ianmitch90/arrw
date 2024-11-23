"use client";

import React from "react";
import {Button, Chip} from "@nextui-org/react";
import {Menu} from "lucide-react";
import {cn} from "@/utils/cn";

export interface MessagingChatHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onOpen?: () => void;
}

export const MessagingChatHeader = React.forwardRef<
  HTMLDivElement,
  MessagingChatHeaderProps
>(({ className, onOpen, ...props }, ref) => {
  return (
    <header
      ref={ref}
      className={cn("flex items-center gap-3", className)}
      {...props}
    >

      <div className="flex items-center gap-2">
        <h1 className="text-base font-medium">Chats</h1>
        <Chip
          variant="flat"
          className="h-[18px] border-1 border-default-200 px-1"
          size="sm"
        >
          24
        </Chip>
      </div>

    </header>
  );
},
);

MessagingChatHeader.displayName = "MessagingChatHeader";

export default MessagingChatHeader;
