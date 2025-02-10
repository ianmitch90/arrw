import { useRouter, useSearchParams } from 'next/navigation';
import { ChatList } from '@/components/chat/ChatList';
import { ChatView } from '@/components/chat/ChatView';
import { cn } from '@/lib/utils';
import { ExpiringChats } from '@/components/chat/ExpiringChats';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function OverlayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const selectedId = searchParams?.get('id') ?? null;
  const isMobile = !useMediaQuery('(min-width: 768px)');

  if (!chatType) return null;

  // On mobile, show either list or chat
  const shouldShowChat = isMobile && selectedId;
  const shouldShowList = isMobile ? !selectedId : true;

  if (!shouldShowList && !shouldShowChat) return null;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          {isMobile && selectedId && (
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
            {shouldShowChat ? 'Chat' : 'Messages'}
          </h2>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="h-full flex flex-col">
          <div className="flex-1 min-h-0">
            {shouldShowChat ? (
              <ChatView chatId={selectedId} chatType={chatType} />
            ) : (
              <ChatList chatType={chatType} />
            )}
          </div>
          
          {!shouldShowChat && (
            <>
              <ExpiringChats />
              
              {/* Safety Disclaimer */}
              <div className="px-4 py-3 text-xs text-center text-muted-foreground border-t">
                <p>For your safety and privacy, messages older than 30 days will be automatically deleted.</p>
                <p className="mt-1">Practice safe and responsible communication.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
