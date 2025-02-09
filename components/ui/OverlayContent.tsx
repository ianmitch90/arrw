import { useSearchParams } from 'next/navigation';
import Messages from '@/components/chat/Messages';

export function OverlayContent() {
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const selectedId = searchParams?.get('id') ?? null;

  const updateUrl = (id: string | null) => {
    if (!searchParams) return;
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set('id', id);
    else params.delete('id');
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  const renderContent = () => {
    switch (chatType) {
      case 'messages':
      case 'global':
        return (
          <Messages
            selectedChatId={selectedId}
            onSelectChat={updateUrl}
          />
        );
      default:
        return null;
    }
  };

  return <div className="h-full overflow-auto">{renderContent()}</div>;
}
