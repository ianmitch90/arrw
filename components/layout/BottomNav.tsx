import { User, MapPin, MessageSquare, Globe } from 'lucide-react';
import { Button } from '@nextui-org/react';

interface BottomNavProps {
  currentView: 'account' | 'map' | 'chat' | 'global';
  onViewChange: (view: 'account' | 'map' | 'chat' | 'global') => void;
  hasUnreadMessages?: boolean;
  hasEventRequests?: boolean;
}

export function BottomNav({
  currentView,
  onViewChange,
  hasUnreadMessages,
  hasEventRequests
}: BottomNavProps) {
  const navItems = [
    {
      key: 'account',
      icon: User,
      label: 'Account'
    },
    {
      key: 'map',
      icon: MapPin,
      label: 'Explore'
    },
    {
      key: 'chat',
      icon: MessageSquare,
      label: 'Chat',
      notification: hasUnreadMessages || hasEventRequests
    },
    {
      key: 'global',
      icon: Globe,
      label: 'Local'
    }
  ] as const;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t">
      <nav className="flex items-center justify-around px-2 h-16">
        {navItems.map((item) => (
          <Button
            key={item.key}
            variant={currentView === item.key ? 'solid' : 'light'}
            color={currentView === item.key ? 'primary' : 'default'}
            onPress={() => onViewChange(item.key)}
            className="flex-1 h-12 max-w-[100px]"
          >
            <div className="flex flex-col items-center gap-0.5">
              <item.icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
              {item.notification && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
              )}
            </div>
          </Button>
        ))}
      </nav>

      {/* Safe area spacing for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
