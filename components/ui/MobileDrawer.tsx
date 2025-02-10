import { Drawer } from 'vaul';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  children: React.ReactNode;
}

export function MobileDrawer({ children }: MobileDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatType = searchParams?.get('chat') ?? null;
  const isOpen = !!chatType;

  const handleClose = () => {
    if (!searchParams) {
      router.push('/map');
      return;
    }
    // Keep all other params except chat
    const params = new URLSearchParams(searchParams.toString());
    params.delete('chat');
    params.delete('id'); // Also remove chat ID when closing
    const newQuery = params.toString();
    router.push(`/map${newQuery ? `?${newQuery}` : ''}`);
  };

  return (
    <Drawer.Root 
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
      modal={true}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" 
        />
        <Drawer.Content 
          className={cn(
            "fixed bottom-0 left-0 right-0 z-50",
            "h-[85%] flex flex-col",
            "bg-background/80 backdrop-blur-md",
            "rounded-t-[20px] shadow-xl",
            "border-t border-border/50",
            "will-change-transform",
            "dark:bg-background/90"
          )}
        >
          {/* Drag handle */}
          <div className="px-4 pt-4 pb-2">
            <div className="mx-auto h-1.5 w-12 flex-shrink-0 rounded-full bg-border/50" />
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-auto overscroll-contain">
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
