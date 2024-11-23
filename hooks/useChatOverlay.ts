import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type ChatType = 'messages' | 'global' | null;

export function useChatOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const chatType = searchParams.get('chat') as ChatType;

  // Update URL without navigation when chat type changes
  const openChat = useCallback((type: ChatType) => {
    const url = new URL(window.location.href);
    if (type) {
      url.searchParams.set('chat', type);
    } else {
      url.searchParams.delete('chat');
    }
    window.history.pushState({}, '', url.toString());
    setIsOpen(!!type);
  }, []);

  // Handle initial state and browser back/forward
  useEffect(() => {
    setIsOpen(!!chatType);

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setIsOpen(!!params.get('chat'));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [chatType]);

  const onClose = useCallback(() => {
    openChat(null);
  }, [openChat]);

  return {
    isOpen,
    chatType,
    openChat,
    onClose,
  };
}
