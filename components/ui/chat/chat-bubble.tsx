import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Avatar, Button, type ButtonProps } from "@heroui/react";
import MessageLoading from "./message-loading";
import { UserAvatar } from "@/components/ui/UserAvatar";

// ChatBubble
const chatBubbleVariant = cva(
  "flex gap-2 max-w-[60%] items-end relative group transition-all",
  {
    variants: {
      variant: {
        received: "self-start",
        sent: "self-end flex-row-reverse",
      },
      layout: {
        default: "",
        ai: "max-w-full w-full items-center",
      },
    },
    defaultVariants: {
      variant: "received",
      layout: "default",
    },
  },
);

interface ChatBubbleProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chatBubbleVariant> {}

const ChatBubble = React.forwardRef<HTMLDivElement, ChatBubbleProps>(
  ({ className, variant, layout, children, ...props }, ref) => (
    <div
      className={cn(
        chatBubbleVariant({ variant, layout, className }),
        "relative group",
      )}
      ref={ref}
      {...props}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && typeof child.type !== "string"
          ? React.cloneElement(child, {
              variant,
              layout,
            } as React.ComponentProps<typeof child.type>)
          : child,
      )}
    </div>
  ),
);

ChatBubble.displayName = "ChatBubble";

// ChatBubbleAvatar
interface ChatBubbleAvatarProps {
  src?: string;
  fallback?: string;
  className?: string;
}

const ChatBubbleAvatar = React.forwardRef<HTMLDivElement, ChatBubbleAvatarProps>(
  ({ src, fallback, className }, ref) => (
    <Avatar
      src={src}
      name={fallback}
      className={cn("h-8 w-8", className)}
      showFallback
    />
  ),
);

ChatBubbleAvatar.displayName = "ChatBubbleAvatar";

// ChatBubbleMessage
const chatBubbleMessageVariants = cva("p-4", {
  variants: {
    variant: {
      received: "bg-default-100 text-default-foreground rounded-2xl rounded-bl-none",
      sent: "bg-primary text-primary-foreground rounded-2xl rounded-br-none",
    },
    layout: {
      default: "",
      ai: "bg-default-50 rounded-xl max-w-[800px] mx-auto",
    },
  },
  defaultVariants: {
    variant: "received",
    layout: "default",
  },
});

// ChatBubbleMessage
interface ChatBubbleMessageProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean;
}

const ChatBubbleMessage = React.forwardRef<HTMLDivElement, ChatBubbleMessageProps>(
  ({ children, isLoading, className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1", className)} {...props}>
      {isLoading ? <MessageLoading /> : children}
    </div>
  )
);

ChatBubbleMessage.displayName = "ChatBubbleMessage";

// ChatBubbleTimestamp
interface ChatBubbleTimestampProps
  extends React.HTMLAttributes<HTMLDivElement> {
  timestamp: string;
}

const ChatBubbleTimestamp = React.forwardRef<
  HTMLDivElement,
  ChatBubbleTimestampProps
>(({ timestamp, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-tiny text-default-400 select-none px-2",
      className,
    )}
    {...props}
  >
    {timestamp}
  </div>
));

ChatBubbleTimestamp.displayName = "ChatBubbleTimestamp";

type ChatBubbleActionProps = ButtonProps & {
  icon: React.ReactNode;
};

const ChatBubbleAction = React.forwardRef<
  HTMLButtonElement,
  ChatBubbleActionProps
>(({ icon, className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      'opacity-0 group-hover:opacity-100 transition-opacity',
      className
    )}
    isIconOnly
    variant="light"
    size="sm"
    {...props}
  >
    {icon}
  </Button>
));

ChatBubbleAction.displayName = "ChatBubbleAction";

// ChatBubbleActionWrapper
interface ChatBubbleActionWrapperProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "sent" | "received";
}

const ChatBubbleActionWrapper = React.forwardRef<
  HTMLDivElement,
  ChatBubbleActionWrapperProps
>(({ variant, className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute top-0 flex gap-1",
      variant === "sent" ? "left-0 -translate-x-full" : "right-0 translate-x-full",
      className,
    )}
    {...props}
  >
    {children}
  </div>
));

ChatBubbleActionWrapper.displayName = "ChatBubbleActionWrapper";

export {
  ChatBubble,
  ChatBubbleAvatar,
  ChatBubbleMessage,
  ChatBubbleTimestamp,
  ChatBubbleAction,
  ChatBubbleActionWrapper,
};
