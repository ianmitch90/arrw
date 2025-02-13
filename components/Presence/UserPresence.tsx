import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, Card, Chip } from '@heroui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';

interface UserPresenceProps {
  userId: string;
  showTyping?: boolean;
  showZone?: boolean;
}

type PresenceState = {
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  activity?: string;
  isTyping?: boolean;
  typingIn?: string;
  activeZone?: string;
  zoneEnteredAt?: Date;
  lastActivity?: {
    type: string;
    [key: string]: any;
  };
};

export function UserPresence({ userId, showTyping = true, showZone = true }: UserPresenceProps) {
  const supabase = useSupabaseClient<Database>();
  const [presence, setPresence] = useState<PresenceState | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`presence:${userId}`);

    // Subscribe to presence updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userState = state[userId];
        if (userState?.[0]) {
          // First convert to unknown, then create a properly typed presence state
          const presenceData = userState[0] as unknown;
          
          // Create a default presence state with required fields
          const defaultPresence: PresenceState = {
            status: 'offline',
            lastSeen: new Date(),
            ...presenceData as Partial<PresenceState>
          };
          
          setPresence(defaultPresence);
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, supabase]);

  if (!presence) return null;

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Avatar
            isBordered
            color={presence.status === 'online' ? 'success' : presence.status === 'away' ? 'warning' : 'default'}
            className="w-10 h-10"
          />
          {presence.status === 'online' && (
            <motion.div
              className="absolute inset-0 rounded-full bg-success/30"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.7, 0.3, 0.7]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <span className="font-medium">
              {presence.activity || 'Online'}
            </span>
            {showTyping && presence.isTyping && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Chip
                    color="primary"
                    variant="flat"
                    size="sm"
                  >
                    Typing in {presence.typingIn}...
                  </Chip>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
          
          {showZone && presence.activeZone && (
            <div className="text-sm text-default-500">
              In {presence.activeZone} for{' '}
              {formatDistanceToNow(presence.zoneEnteredAt!, { addSuffix: true })}
            </div>
          )}
          
          {presence.status !== 'online' && (
            <div className="text-sm text-default-500">
              Last seen {formatDistanceToNow(presence.lastSeen, { addSuffix: true })}
            </div>
          )}
        </div>
      </div>

      {presence.lastActivity?.type !== 'none' && (
        <div className="text-sm text-default-500">
          {presence.lastActivity?.type === 'left_zone' ? (
            <>Left {presence.lastActivity.previous_zone} after {Math.round(presence.lastActivity.time_spent / 60)} minutes</>
          ) : (
            presence.lastActivity?.type
          )}
        </div>
      )}
    </Card>
  );
}
