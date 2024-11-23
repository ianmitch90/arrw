'use client';

import { useState, useRef } from 'react';
import { Button, Input, Tooltip } from '@nextui-org/react';
import { Mic, Send, Image as ImageIcon, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useChat } from '../contexts/ChatContext';

interface ChatInputProps {
  chatId: string;
  onSend?: () => void;
  className?: string;
}

export function ChatInput({ chatId, onSend, className }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    if (selectedFile) {
      // Handle file upload here
      console.log('Uploading file:', selectedFile);
    }

    sendMessage({
      roomId: chatId,
      content: message,
      type: selectedFile ? 'image' : 'text',
      metadata: selectedFile ? {
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        // Add thumbnail URL after upload
      } : undefined
    });

    setMessage('');
    setSelectedFile(null);
    onSend?.();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
    }
  };

  return (
    <div className={cn("flex w-full items-end gap-2", className)}>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Tooltip content="Upload image">
        <Button
          isIconOnly
          variant="light"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          <ImageIcon size={20} />
        </Button>
      </Tooltip>

      <div className="relative flex-grow">
        {selectedFile && (
          <div className="absolute bottom-full mb-2 flex items-center gap-2 rounded-medium bg-default-100 p-2">
            <span className="text-tiny">{selectedFile.name}</span>
            <Button
              isIconOnly
              size="sm"
              variant="light"
              onClick={() => setSelectedFile(null)}
            >
              <X size={16} />
            </Button>
          </div>
        )}

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          size="sm"
          radius="lg"
          classNames={{
            input: "text-small",
          }}
          endContent={
            <Tooltip content="Voice message">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="text-default-500"
              >
                <Mic size={20} />
              </Button>
            </Tooltip>
          }
        />
      </div>

      <Tooltip content="Send message">
        <Button
          isIconOnly
          color="primary"
          size="sm"
          onClick={handleSend}
          isDisabled={!message.trim() && !selectedFile}
        >
          <Send size={20} />
        </Button>
      </Tooltip>
    </div>
  );
}
