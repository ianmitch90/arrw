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
  const isMobile = !useMediaQuery('(min-width: 768px)');

  if (!isOpen) return null;

  return (
    <>
      {isMobile ? (
        <MobileDrawer>
          <OverlayContent />
        </MobileDrawer>
      ) : (
        <div className="hidden md:block">
          <div className={cn(
            'fixed left-0 top-[80px] z-50',
            'h-[calc(100vh-160px)] w-[400px]',
            'bg-background/80 backdrop-blur-md',
            'border-r border-border/50',
            'dark:bg-background/90'
          )}>
            <OverlayContent />
          </div>
        </div>
      )}
    </>
  );
}
