'use client';

import { usePathname, useRouter } from 'next/navigation';
import { MapIcon, MessageCircleIcon, UsersIcon, UserIcon } from 'lucide-react';
import { useChatOverlay, ChatType } from '@/hooks/useChatOverlay';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: UserIcon
  },
  {
    label: 'Map',
    href: '/map',
    icon: MapIcon
  },
  {
    label: 'Messages',
    href: '/messages',
    icon: MessageCircleIcon
  },
  {
    label: 'Global',
    href: '/global',
    icon: UsersIcon
  }
];

const BottomBar = () => {
  const { openChat, chatType } = useChatOverlay();
  const pathname = usePathname();
  const router = useRouter();

  const handleChatClick = (type: ChatType) => {
    openChat(type === chatType ? null : type);
  };

  return (
    <div className="fixed bottom-0 z-50 w-full flex justify-center pb-safe">
      <nav className="relative mx-4 mb-4 flex h-16 w-full max-w-md items-center justify-around rounded-2xl border border-white/10 bg-black/10  px-6 backdrop-blur-lg">
        <button
          onClick={() =>
            navigationItems[0].href === pathname
              ? null
              : router.push(navigationItems[0].href)
          }
          className={[
            'flex flex-col items-center justify-center',
            pathname === navigationItems[0].href
              ? 'text-primary'
              : 'text-foreground/60'
          ].join(' ')}
        >
          <UserIcon size={20} />
          <span className="mt-1 text-xs">{navigationItems[0].label}</span>
        </button>

        <button
          onClick={() =>
            navigationItems[1].href === pathname
              ? null
              : router.push(navigationItems[1].href)
          }
          className={[
            'flex flex-col items-center justify-center',
            pathname === navigationItems[1].href
              ? 'text-primary'
              : 'text-foreground/60'
          ].join(' ')}
        >
          <MapIcon size={20} />
          <span className="mt-1 text-xs">{navigationItems[1].label}</span>
        </button>

        <button
          onClick={() => handleChatClick('messages')}
          className={[
            'flex flex-col items-center justify-center',
            chatType === 'messages' ? 'text-primary' : 'text-foreground/60'
          ].join(' ')}
        >
          <MessageCircleIcon size={20} />
          <span className="mt-1 text-xs">{navigationItems[2].label}</span>
        </button>

        <button
          onClick={() => handleChatClick('global')}
          className={[
            'flex flex-col items-center justify-center',
            chatType === 'global' ? 'text-primary' : 'text-foreground/60'
          ].join(' ')}
        >
          <UsersIcon size={20} />
          <span className="mt-1 text-xs">{navigationItems[3].label}</span>
        </button>
      </nav>
    </div>
  );
};

export default BottomBar;
