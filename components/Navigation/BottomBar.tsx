import { Button } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { usePathname } from 'next/navigation';

export function BottomBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 w-full px-4 py-2 bg-background/80 backdrop-blur-md z-50 border-t border-default-200">
      <div className="flex items-center justify-around max-w-md mx-auto">
        <Button
          isIconOnly
          variant="light"
          aria-label="Profile"
          className={pathname === '/profile' ? 'text-danger' : ''}
        >
          <Icon icon="lucide:user" className="text-2xl" />
        </Button>

        <Button
          isIconOnly
          variant="solid"
          color="danger"
          aria-label="Map"
          className="scale-110 bg-danger/10 text-danger"
        >
          <Icon icon="lucide:map" className="text-2xl" />
        </Button>

        <Button
          isIconOnly
          variant="light"
          aria-label="Messages"
          className={pathname === '/messages' ? 'text-danger' : ''}
        >
          <Icon icon="lucide:message-circle" className="text-2xl" />
        </Button>

        <Button
          isIconOnly
          variant="light"
          aria-label="Settings"
          className={pathname === '/settings' ? 'text-danger' : ''}
        >
          <Icon icon="lucide:lock" className="text-2xl" />
        </Button>
      </div>
    </div>
  );
}
