"use client";

import React, { useState, useRef } from "react";
import { Button, Tooltip } from "@nextui-org/react";
import { Image, Paperclip, Send, Smile } from "lucide-react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Message } from "@/types/chat";
import { cn } from "@/utils/cn";

interface ChatInputProps {
  onSend: (content: string, type?: Message["type"], metadata?: Message["metadata"]) => void;
  className?: string;
}

export function ChatInput({ onSend, className }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Handle different file types
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    const reader = new FileReader();
    reader.onload = async () => {
      const metadata: Message["metadata"] = {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      };

      if (isImage || isVideo) {
        // Create thumbnail for image/video
        const img = new Image();
        img.src = reader.result as string;
        await new Promise((resolve) => (img.onload = resolve));
        
        metadata.thumbnailUrl = reader.result as string;
        metadata.dimensions = {
          width: img.width,
          height: img.height,
        };

        if (isVideo) {
          const video = document.createElement("video");
          video.src = reader.result as string;
          await new Promise((resolve) => (video.onloadedmetadata = resolve));
          metadata.duration = video.duration;
        }
      }

      onSend(
        file.name,
        isImage ? "image" : isVideo ? "video" : "file",
        metadata
      );
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiSelect = (emoji: any) => {
    setMessage((prev) => prev + emoji.native);
    setShowEmoji(false);
    textareaRef.current?.focus();
  };

  return (
    <div className={cn("relative flex items-end gap-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileSelect}
      />

      <div className="flex items-center gap-2">
        <Tooltip content="Add file">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
        </Tooltip>
        <Tooltip content="Add image">
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="h-5 w-5" />
          </Button>
        </Tooltip>
      </div>

      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${e.target.scrollHeight}px`;
          }}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="w-full resize-none rounded-xl bg-default-100 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20"
          rows={1}
          style={{ maxHeight: "150px" }}
        />
        <Button
          isIconOnly
          variant="light"
          size="sm"
          className="absolute bottom-2 right-2"
          onClick={() => setShowEmoji(!showEmoji)}
        >
          <Smile className="h-5 w-5" />
        </Button>
        {showEmoji && (
          <div className="absolute bottom-full right-0 mb-2">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="dark"
            />
          </div>
        )}
      </div>

      <Button
        isIconOnly
        color="primary"
        variant="solid"
        size="lg"
        onClick={handleSend}
        isDisabled={!message.trim()}
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
