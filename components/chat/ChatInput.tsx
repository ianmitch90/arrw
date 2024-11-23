'use client';

import { useState, useRef } from 'react';
import { Button, Input,Textarea, Popover, PopoverTrigger, PopoverContent, Card } from '@nextui-org/react';
import { ArrowUp, Plus, Image as ImageIcon, Smile, Mic } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useChat } from '../contexts/ChatContext';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface ChatInputProps {
  onSend: (content: string) => void;
  className?: string;
}

export function ChatInput({ onSend, className }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showActions, setShowActions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage } = useChat();

  const handleSend = () => {
    if (!message.trim() && !selectedFile) return;

    if (selectedFile) {
      // Handle file upload here
      console.log('Uploading file:', selectedFile);
    }

    onSend(message);
    setMessage('');
    setSelectedFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setShowActions(false);
    }
  };

  const onEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
  };

  return (
    <div className={cn("relative flex w-full items-center gap-2", className)}>
      <input
        id="fileInput"
        aria-label="upload file"
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileSelect}
      />

      <Popover placement="top" isOpen={showActions} onOpenChange={setShowActions}>
        <PopoverTrigger>
          <Button
            isIconOnly
            variant="light"
            className="flex-none text-default-500"
            size="sm"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Card className="border-none p-3">
            <div className="flex gap-2">
              <Button
                isIconOnly
                variant="flat"
                className="flex-none"
                size="sm"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <Button
                isIconOnly
                variant="flat"
                className="flex-none"
                size="sm"
              >
                <Mic className="h-5 w-5" />
              </Button>
            </div>
          </Card>
        </PopoverContent>
      </Popover>

      <Textarea
        minRows={1}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder="Type a message..."
        variant="flat"
        classNames={{
          input: "min-h-unit-10 h-unit-10",
          inputWrapper: "h-unit-10 pr-0",
        }}
        endContent={
          <Popover placement="top">
            <PopoverTrigger>
              <Button
                isIconOnly
                variant="light"
                className="flex-none text-default-500"
                size="sm"
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0">
              <Picker
                data={data}
                onEmojiSelect={onEmojiSelect}
                theme="light"
                set="native"
              />
            </PopoverContent>
          </Popover>
        }
      />

      <Button
        isIconOnly
        color="primary"
        className="h-unit-10 w-unit-10 min-w-unit-10 rounded-full"
        onPress={handleSend}
        isDisabled={!message.trim() && !selectedFile}
      >
        <ArrowUp className="h-5 w-5" />
      </Button>
    </div>
  );
}
