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
    >
      <Drawer.Portal>
        <Drawer.Overlay 
          className="fixed inset-0 bg-black/40 z-50" 
          onClick={() => handleClose()}
        />
        <Drawer.Content 
          className={cn(
            "fixed bottom-0 left-0 right-0 mt-24 flex h-[85%] flex-col rounded-t-[10px] bg-background z-50",
            "overflow-hidden" // Prevent content overflow
          )}
        >
          <div className="flex-1 rounded-t-[10px] bg-background p-4">
            <button 
              onClick={() => handleClose()}
              className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full"
            >
              ✕
            </button>
            <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300" />
            <div className="mx-auto max-w-md overflow-y-auto h-full">
              {children}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
