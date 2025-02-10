import { cn } from '@/lib/utils';
import { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useChat } from '@/components/contexts/ChatContext';

interface ExpiringChat {
  id: string;
  avatarUrl: string;
  lastMessageDate: Date;
  expiresIn: number; // days
  name: string;
}

export function ExpiringChats() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { rooms } = useChat();
  const chatType = searchParams?.get('chat') ?? 'messages';
  
  const expiringChats = useMemo(() => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    
    return rooms
      .filter(room => {
        const messageAge = now - room.lastMessageTimestamp.getTime();
        return messageAge >= (25 * 24 * 60 * 60 * 1000) && messageAge < thirtyDays;
      })
      .map(room => ({
        id: room.id,
        avatarUrl: room.participants[0].avatarUrl,
        lastMessageDate: room.lastMessageTimestamp,
        expiresIn: Math.ceil((thirtyDays - (now - room.lastMessageTimestamp.getTime())) / (24 * 60 * 60 * 1000)),
        name: room.type === 'direct' ? room.participants[0].fullName : room.name,
        type: room.type
      }))
      .sort((a, b) => b.lastMessageDate.getTime() - a.lastMessageDate.getTime()); // Sort by date, newest first
  }, [rooms]);

  if (expiringChats.length === 0) return null;

  return (
    <div className="w-full px-4 py-3 border-t">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Expiring Soon</h3>
          <span className="text-xs text-muted-foreground">Auto-delete in 30 days</span>
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2">
          {expiringChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => {
                const params = new URLSearchParams(searchParams?.toString() ?? '');
                params.set('chat', chatType);
                params.set('id', chat.id);
                router.push(`/map?${params.toString()}`);
              }}
              className={cn(
                'relative group p-1',
                'hover:bg-accent rounded-full',
                'transition-colors duration-200'
              )}
            >
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="absolute -bottom-1 -right-1 bg-destructive text-[10px] text-white rounded-full px-1">
                {chat.expiresIn}d
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
