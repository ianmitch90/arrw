import { useRouter, useSearchParams } from 'next/navigation';
import { MobileDrawer } from './MobileDrawer';
import { OverlayContent } from './OverlayContent';
import { cn } from '@/lib/utils';
import { ChatView } from '@/components/chat/ChatView';
import { useMediaQuery } from '@/hooks/useMediaQuery';

export function ResponsiveOverlay() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const selectedId = searchParams?.get('id') ?? null;
  const isOpen = !!chatType;

  if (!isOpen) return null;

  const isMobile = !useMediaQuery('(min-width: 768px)');

  return (
    <>
      {isMobile ? (
        <MobileDrawer>
          <OverlayContent />
        </MobileDrawer>
      ) : (
        <div className="hidden md:block">
          {/* Messages List - Always visible */}
          <div className={cn(
            'fixed left-0 top-[64px] z-50 h-[calc(100vh-64px)] w-[360px]',
            'bg-background/80 backdrop-blur-md',
            'border-r border-border/50',
            'dark:bg-background/90'
          )}>
            <OverlayContent />
          </div>

          {/* Chat View - Slides in from the side */}
          {selectedId && (
            <div className={cn(
              'fixed left-[360px] top-[64px] z-50 h-[calc(100vh-64px)] w-[440px]',
              'bg-background/80 backdrop-blur-md',
              'transition-transform duration-300 ease-in-out',
              'dark:bg-background/90'
            )}>
              <div className="h-full">
                <div className="flex items-center justify-between px-4 py-3 border-b">
                  <h2 className="text-lg font-semibold">Chat</h2>
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
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <ChatView chatId={selectedId} chatType={chatType} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
