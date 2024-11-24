import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Chip, Button, Avatar, Progress } from '@nextui-org/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Database } from '@/types/supabase';
import { formatDistanceToNow, format } from 'date-fns';
import { MapPin, Clock, Activity, Heart, MessageSquare } from 'lucide-react';

interface AdvancedPresenceProps {
  userId: string;
  showPredictions?: boolean;
  showMoodHistory?: boolean;
}

type ActivityPrediction = {
  activity: string;
  confidence: number;
  predictedLocation: {
    latitude: number;
    longitude: number;
  };
  predictedTime: Date;
};

type MoodHistory = {
  mood: string;
  statusMessage: string | null;
  recordedAt: Date;
};

type PresenceState = {
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  mood?: string;
  statusMessage?: string;
  activity?: string;
  activeZone?: string;
  zoneEnteredAt?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
};

export function AdvancedPresence({ 
  userId, 
  showPredictions = true,
  showMoodHistory = true 
}: AdvancedPresenceProps) {
  const supabase = useSupabaseClient<Database>();
  const [presence, setPresence] = useState<PresenceState | null>(null);
  const [predictions, setPredictions] = useState<ActivityPrediction[]>([]);
  const [moodHistory, setMoodHistory] = useState<MoodHistory[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`presence:${userId}`);

    // Subscribe to presence updates
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userState = state[userId];
        if (userState?.[0]) {
          // First convert to unknown, then to PresenceState
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

    // Fetch predictions and mood history
    if (showPredictions) {
      fetchPredictions();
    }
    if (showMoodHistory) {
      fetchMoodHistory();
    }

    const interval = setInterval(() => {
      if (showPredictions) fetchPredictions();
    }, 5 * 60 * 1000); // Update predictions every 5 minutes

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [userId, supabase, showPredictions, showMoodHistory]);

  const fetchPredictions = async () => {
    const { data } = await supabase.rpc('predict_next_activity', {
      user_id: userId
    });
    if (data) {
      setPredictions(data as unknown as ActivityPrediction[]);
    }
  };

  const fetchMoodHistory = async () => {
    const { data } = await supabase.rpc('get_user_mood_history', {
      target_user_id: userId
    });
    if (data) {
      setMoodHistory(data as unknown as MoodHistory[]);
    }
  };

  if (!presence) return null;

  return (
    <Card className="p-4 space-y-4">
      {/* Current Status */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Avatar
            isBordered
            color={presence.status === 'online' ? 'success' : presence.status === 'away' ? 'warning' : 'default'}
            className="w-12 h-12"
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
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            {presence.mood && (
              <Chip
                startContent={<Heart className="w-4 h-4" />}
                variant="flat"
                color="secondary"
              >
                {presence.mood}
              </Chip>
            )}
            {presence.statusMessage && (
              <Chip
                startContent={<MessageSquare className="w-4 h-4" />}
                variant="flat"
              >
                {presence.statusMessage}
              </Chip>
            )}
          </div>
          
          <div className="mt-1 text-sm text-default-500">
            {presence.activeZone ? (
              <div className="flex items-center space-x-1">
                <MapPin className="w-4 h-4" />
                <span>In {presence.activeZone}</span>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <span>
                  {formatDistanceToNow(presence.zoneEnteredAt!, { addSuffix: true })}
                </span>
              </div>
            ) : presence.status !== 'online' ? (
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>
                  Last seen {formatDistanceToNow(presence.lastSeen, { addSuffix: true })}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Activity Predictions */}
      {showPredictions && predictions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span className="font-medium">Likely Next Activities</span>
          </div>
          
          <div className="space-y-2">
            {predictions.map((prediction, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span>{prediction.activity}</span>
                  <span className="text-sm text-default-500">
                    {format(prediction.predictedTime, 'h:mm a')}
                  </span>
                </div>
                <Progress 
                  value={prediction.confidence * 100}
                  color="primary"
                  size="sm"
                  className="max-w-md"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood History */}
      {showMoodHistory && moodHistory.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Heart className="w-4 h-4" />
            <span className="font-medium">Recent Moods</span>
          </div>
          
          <div className="space-y-2">
            {moodHistory.map((mood, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Chip size="sm" variant="flat" color="secondary">
                    {mood.mood}
                  </Chip>
                  {mood.statusMessage && (
                    <span className="text-sm text-default-500">
                      {mood.statusMessage}
                    </span>
                  )}
                </div>
                <span className="text-sm text-default-500">
                  {formatDistanceToNow(mood.recordedAt, { addSuffix: true })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
