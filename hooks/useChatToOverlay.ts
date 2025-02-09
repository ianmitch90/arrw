import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/components/contexts/ChatContext';

// This hook bridges the chat system with the URL parameters
export function useChatToOverlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isOpen } = useChat();

  useEffect(() => {
    if (isOpen) {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('chat', 'messages');
      router.push(`/map?${params.toString()}`);
    }
  }, [isOpen, router, searchParams]);
}
