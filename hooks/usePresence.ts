import { useEffect, useRef, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/database.types';
import { useToast } from '@/hooks/useToast';
import { LngLat } from 'mapbox-gl';
import { broadcastService } from '@/utils/broadcastChannel';

const PRESENCE_HEARTBEAT = 30000; // 30 seconds
const PRESENCE_TIMEOUT = 120000; // 2 minutes
const TYPING_TIMEOUT = 3000; // 3 seconds
const ACTIVITY_TIMEOUT = 300000; // 5 minutes

type ActivityType = 'browsing' | 'chatting' | 'viewing_profile' | 'idle';

interface CustomStatus {
  emoji?: string;
  message: string;
  expiresAt?: string;
  visibility: 'public' | 'friends' | 'private';
}

interface PresenceState {
  online_at: string;
  last_seen_at: string;
  location?: {
    longitude: number;
    latitude: number;
  };
  status: 'online' | 'away' | 'offline';
  activity?: ActivityType;
  typing_in?: string; // chat_id or null
  last_activity: string;
  device_info: {
    type: 'mobile' | 'desktop' | 'tablet';
    platform: string;
    browser: string;
  };
  custom_status?: CustomStatus;
  mood?: 'happy' | 'busy' | 'away' | 'dnd' | 'invisible';
  availability_schedule?: {
    start: string;
    end: string;
    timezone: string;
    recurring?: boolean;
  };
}

interface TypingState {
  [chatId: string]: {
    isTyping: boolean;
    timeout?: NodeJS.Timeout;
  };
}

export function usePresence() {
  const supabase = createClientComponentClient<Database>();
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>(
    'offline'
  );
  const [activity, setActivity] = useState<ActivityType>('browsing');
  const presenceChannel = useRef<ReturnType<typeof supabase.channel>>();
  const heartbeatInterval = useRef<NodeJS.Timeout>();
  const typingStates = useRef<TypingState>({});
  const { showToast } = useToast();
  const [customStatus, setCustomStatus] = useState<CustomStatus | null>(null);
  const [mood, setMood] = useState<PresenceState['mood']>();
  const scheduledStatusChanges = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const mobile =
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua
      );
    const tablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua);

    return {
      type: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop',
      platform: navigator.platform,
      browser: navigator.vendor || 'unknown'
    };
  };

  const updatePresence = async (state: Partial<PresenceState>) => {
    try {
      const { error } = await presenceChannel.current?.track({
        ...state,
        last_activity: new Date().toISOString(),
        device_info: getDeviceInfo()
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error updating presence:', err);
      showToast('Failed to update online status', 'error');
    }
  };

  const setTyping = (chatId: string, isTyping: boolean) => {
    // Clear existing timeout
    if (typingStates.current[chatId]?.timeout) {
      clearTimeout(typingStates.current[chatId].timeout);
    }

    if (isTyping) {
      // Set new typing state with timeout
      typingStates.current[chatId] = {
        isTyping: true,
        timeout: setTimeout(() => {
          typingStates.current[chatId].isTyping = false;
          updatePresence({ typing_in: null });
        }, TYPING_TIMEOUT)
      };
      updatePresence({ typing_in: chatId });
    } else {
      // Clear typing state
      typingStates.current[chatId] = { isTyping: false };
      updatePresence({ typing_in: null });
    }
  };

  const updateActivity = (newActivity: ActivityType) => {
    setActivity(newActivity);
    updatePresence({
      activity: newActivity,
      last_activity: new Date().toISOString()
    });
  };

  const setCustomStatusWithExpiry = async (status: CustomStatus) => {
    try {
      await updatePresence({ custom_status: status });
      setCustomStatus(status);

      // Clear existing timeout if any
      if (scheduledStatusChanges.current.has('status')) {
        clearTimeout(scheduledStatusChanges.current.get('status'));
      }

      // Set expiry if specified
      if (status.expiresAt) {
        const timeout = setTimeout(
          () => {
            updatePresence({ custom_status: null });
            setCustomStatus(null);
            scheduledStatusChanges.current.delete('status');
          },
          new Date(status.expiresAt).getTime() - Date.now()
        );

        scheduledStatusChanges.current.set('status', timeout);
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  };

  const setAvailabilitySchedule = async (
    schedule: PresenceState['availability_schedule']
  ) => {
    try {
      await updatePresence({ availability_schedule: schedule });

      // Set up schedule change handlers
      const startTime = new Date(schedule.start).getTime();
      const endTime = new Date(schedule.end).getTime();

      if (startTime > Date.now()) {
        const startTimeout = setTimeout(() => {
          setStatus('online');
          updatePresence({ status: 'online' });
        }, startTime - Date.now());
        scheduledStatusChanges.current.set('scheduleStart', startTimeout);
      }

      if (endTime > Date.now()) {
        const endTimeout = setTimeout(() => {
          setStatus('away');
          updatePresence({ status: 'away' });
        }, endTime - Date.now());
        scheduledStatusChanges.current.set('scheduleEnd', endTimeout);
      }
    } catch (err) {
      showToast('Failed to set availability schedule', 'error');
    }
  };

  useEffect(() => {
    let lastActivity = Date.now();
    let visibilityChange = false;

    const handleActivity = () => {
      lastActivity = Date.now();
      if (status !== 'online') {
        setStatus('online');
        updatePresence({
          status: 'online',
          online_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        });
      }
    };

    const handleVisibilityChange = () => {
      visibilityChange = true;
      if (document.hidden) {
        setStatus('away');
        updatePresence({
          status: 'away',
          last_seen_at: new Date().toISOString()
        });
      } else {
        handleActivity();
      }
    };

    // Enhanced presence channel setup
    presenceChannel.current = supabase.channel('presence', {
      config: {
        presence: {
          key: (async () => {
            const {
              data: { user }
            } = await supabase.auth.getUser();
            return user?.id || '';
          })()
        }
      }
    });

    // Enhanced presence sync handling
    presenceChannel.current
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.current?.presenceState() || {};
        // Track other users' presence states
        Object.entries(state).forEach(([userId, userStates]) => {
          const latestState = Array.isArray(userStates)
            ? userStates[0]
            : userStates;
          // Handle presence updates (typing, activity, etc.)
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // Handle user joining with their initial state
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // Clean up user state when they leave
      })
      .subscribe();

    // Activity monitoring
    const activityInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;
      if (inactiveTime > ACTIVITY_TIMEOUT && activity !== 'idle') {
        updateActivity('idle');
      }
    }, PRESENCE_HEARTBEAT);

    // Event listeners for user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity);
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(activityInterval);
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }

      if (presenceChannel.current) {
        updatePresence({
          status: 'offline',
          last_seen_at: new Date().toISOString()
        }).then(() => {
          presenceChannel.current?.unsubscribe();
        });
      }
    };
  }, []);

  // Clean up scheduled changes
  useEffect(() => {
    return () => {
      scheduledStatusChanges.current.forEach((timeout) =>
        clearTimeout(timeout)
      );
    };
  }, []);

  // Handle presence updates from other tabs
  useEffect(() => {
    const unsubscribe = broadcastService.subscribe(
      'PRESENCE_UPDATE',
      (message) => {
        const {
          data: { status: newStatus, activity: newActivity }
        } = message;

        // Update local state if it's different
        if (status !== newStatus) {
          setStatus(newStatus);
          updatePresence({ status: newStatus });
        }

        if (activity !== newActivity) {
          setActivity(newActivity);
          updatePresence({ activity: newActivity });
        }
      }
    );

    return () => unsubscribe();
  }, [status, activity]);

  // Update status change handlers to broadcast
  const updateStatus = async (newStatus: typeof status) => {
    setStatus(newStatus);
    await updatePresence({ status: newStatus });

    broadcastService.broadcast('PRESENCE_UPDATE', {
      status: newStatus
    });
  };

  const updateActivity = async (newActivity: ActivityType) => {
    setActivity(newActivity);
    await updatePresence({ activity: newActivity });

    broadcastService.broadcast('PRESENCE_UPDATE', {
      activity: newActivity
    });
  };

  return {
    status,
    activity,
    setTyping,
    updateActivity,
    customStatus,
    setCustomStatus: setCustomStatusWithExpiry,
    mood,
    setMood: async (newMood: PresenceState['mood']) => {
      await updatePresence({ mood: newMood });
      setMood(newMood);
    },
    setAvailabilitySchedule
  };
}
