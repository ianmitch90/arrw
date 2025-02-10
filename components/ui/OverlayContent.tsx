import { useSearchParams } from 'next/navigation';
import { ChatList } from '@/components/chat/ChatList';
import { ChatView } from '@/components/chat/ChatView';
import { VaultContainer } from './VaultContainer';

export function OverlayContent() {
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const selectedId = searchParams?.get('id') ?? null;

  if (!chatType) return null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {selectedId && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams?.toString() ?? '');
                params.delete('id');
                const newQuery = params.toString();
                router.push(`/map?${newQuery}`);
              }}
              className="p-1.5 hover:bg-accent rounded-full"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold">
            {selectedId ? 'Chat' : 'Messages'}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {selectedId ? (
          <ChatView chatId={selectedId} chatType={chatType} />
        ) : (
          <ChatList chatType={chatType} />
        )}
      </div>
    </div>
  );
}
