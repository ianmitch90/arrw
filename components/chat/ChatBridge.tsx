import { useChatToOverlay } from '@/hooks/useChatToOverlay';

export function ChatBridge() {
  // This component just uses the hook to bridge the systems
  useChatToOverlay();
  return null;
}
