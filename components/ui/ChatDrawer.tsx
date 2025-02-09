import { useRouter, useSearchParams } from 'next/navigation';
import { Drawer } from 'vaul';

interface ChatDrawerProps {
  children: React.ReactNode;
}

export function ChatDrawer({ children }: ChatDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get('chat');
  const isOpen = !!chatParam;

  const handleClose = () => {
    router.push('/map');
  };

  return (
    <Drawer.Root 
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 mt-24 flex h-[85%] flex-col rounded-t-[10px] bg-background z-50">
          <div className="flex-1 rounded-t-[10px] bg-background p-4">
            <div className="mx-auto mb-8 h-1.5 w-12 flex-shrink-0 rounded-full bg-zinc-300" />
            <div className="mx-auto max-w-md">
              {children}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
