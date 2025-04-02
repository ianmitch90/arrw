import { format, formatDistanceToNow } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Message, ChatUser } from '@/types/chat';

// Prepare for i18n by centralizing string formatting
export const chatDateFormat = {
  time: (date: Date) => format(date, 'HH:mm', { locale: enUS }),
  date: (date: Date) => format(date, 'MMM d, yyyy', { locale: enUS }),
  relative: (date: Date) => formatDistanceToNow(date, { 
    addSuffix: true,
    locale: enUS 
  }),
  messageDate: (date: Date) => {
    const now = new Date();
    const isToday = format(date, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
    const isThisYear = format(date, 'yyyy') === format(now, 'yyyy');
    
    if (isToday) {
      return format(date, 'HH:mm', { locale: enUS });
    }
    if (isThisYear) {
      return format(date, 'MMM d', { locale: enUS });
    }
    return format(date, 'MMM d, yyyy', { locale: enUS });
  }
};

export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
};

export const groupMessagesByDate = (messages: Message[]): {
  date: string;
  messages: Message[];
}[] => {
  const groups: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = format(new Date(message.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
  });

  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, messages]) => ({
      date,
      messages: messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
    }));
};

export const shouldShowAvatar = (
  message: Message,
  previousMessage?: Message,
  timeThreshold: number = 300000 // 5 minutes
): boolean => {
  if (!previousMessage) return true;
  
  return (
    message.senderId !== previousMessage.senderId ||
    new Date(message.createdAt).getTime() -
      new Date(previousMessage.createdAt).getTime() >
      timeThreshold
  );
};

export const getMessagePosition = (
  message: Message,
  previousMessage?: Message,
  nextMessage?: Message
): 'single' | 'first' | 'middle' | 'last' => {
  const isSameSenderAsPrevious = previousMessage?.senderId === message.senderId;
  const isSameSenderAsNext = nextMessage?.senderId === message.senderId;
  
  if (!isSameSenderAsPrevious && !isSameSenderAsNext) return 'single';
  if (!isSameSenderAsPrevious && isSameSenderAsNext) return 'first';
  if (isSameSenderAsPrevious && isSameSenderAsNext) return 'middle';
  return 'last';
};

export const searchMessages = (
  messages: Message[],
  query: string,
  options: {
    searchContent?: boolean;
    searchSender?: boolean;
    caseSensitive?: boolean;
  } = {}
): Message[] => {
  const {
    searchContent = true,
    searchSender = true,
    caseSensitive = false
  } = options;

  const normalizeText = (text: string) =>
    caseSensitive ? text : text.toLowerCase();
  const searchQuery = normalizeText(query);

  return messages.filter(message => {
    if (searchContent && normalizeText(message.content).includes(searchQuery)) {
      return true;
    }
    if (searchSender && normalizeText(message.senderId).includes(searchQuery)) {
      return true;
    }
    return false;
  });
};

export const formatRelativeTime = (timestamp: string | number | Date): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp);
  
  // Check if date is invalid
  if (isNaN(date.getTime())) {
    return '';
  }
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
  
  // Default to regular date format
  return chatDateFormat.messageDate(date);
};
