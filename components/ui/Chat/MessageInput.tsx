import { useState, useRef, ChangeEvent } from 'react';
import { Input, Button, Popover, PopoverTrigger, PopoverContent, Select, SelectItem } from '@nextui-org/react';
import { Send, Image, Timer } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendEphemeralMedia?: (file: File, duration: number) => void;
  disabled?: boolean;
}

const EPHEMERAL_DURATIONS = [
  { value: '10', label: '10 seconds' },
  { value: '30', label: '30 seconds' },
  { value: '60', label: '1 minute' },
  { value: '300', label: '5 minutes' },
  { value: '3600', label: '1 hour' },
  { value: '86400', label: '24 hours' },
];

export function MessageInput({
  onSendMessage,
  onSendEphemeralMedia,
  disabled
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isEphemeralMode, setIsEphemeralMode] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState('30');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = () => {
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      if (isEphemeralMode && onSendEphemeralMedia) {
        onSendEphemeralMedia(file, parseInt(selectedDuration));
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          onSendMessage(content);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div className="p-4 bg-background/60 backdrop-blur-sm border-t">
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,video/*"
          onChange={handleFileSelect}
        />

        <Popover placement="top" isOpen={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen}>
          <PopoverTrigger>
            <Button
              isIconOnly
              variant="light"
              className="text-default-900"
            >
              😊
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0">
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => {
                setMessage((prev) => prev + emoji.native);
                setIsEmojiPickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <Button
          isIconOnly
          variant="light"
          onPress={() => fileInputRef.current?.click()}
        >
          <Image className="w-5 h-5" />
        </Button>

        {onSendEphemeralMedia && (
          <Popover placement="top">
            <PopoverTrigger>
              <Button
                isIconOnly
                variant={isEphemeralMode ? 'solid' : 'light'}
                color={isEphemeralMode ? 'primary' : 'default'}
                onPress={() => setIsEphemeralMode(!isEphemeralMode)}
              >
                <Timer className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="p-4">
                <Select
                  label="Duration"
                  value={selectedDuration}
                  onChange={(e) => setSelectedDuration(e.target.value)}
                >
                  {EPHEMERAL_DURATIONS.map((duration) => (
                    <SelectItem key={duration.value} value={duration.value}>
                      {duration.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        )}

        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          disabled={disabled}
          classNames={{
            input: 'max-h-[120px]'
          }}
        />

        <Button
          isIconOnly
          color="primary"
          onPress={handleSendMessage}
          isDisabled={!message.trim() || disabled}
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>

      {isEphemeralMode && (
        <div className="mt-2 text-xs text-default-500 flex items-center gap-1">
          <Timer className="w-4 h-4" />
          <span>
            Ephemeral mode active - media will expire after{' '}
            {EPHEMERAL_DURATIONS.find((d) => d.value === selectedDuration)?.label}
          </span>
        </div>
      )}
    </div>
  );
}
