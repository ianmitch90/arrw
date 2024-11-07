import { supabase } from '@/utils/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Message {
  id: string;
  sender_id: string;
  content: string;
  room_id: string;
  created_at: string;
  attachments?: {
    type: 'image' | 'video' | 'location';
    url?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }[];
}

export class RealtimeMessaging {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers: Map<string, (message: Message) => void> = new Map();

  async joinRoom(roomId: string, onMessage: (message: Message) => void) {
    if (this.channels.has(roomId)) {
      return;
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: await this.getUserPresenceKey() }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        this.updatePresence(roomId);
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          onMessage(payload.new as Message);
        }
      )
      .subscribe();

    this.channels.set(roomId, channel);
    this.messageHandlers.set(roomId, onMessage);
  }

  async sendMessage(
    roomId: string,
    content: string,
    attachments?: Message['attachments']
  ) {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: user.id,
      content,
      attachments
    });

    if (error) throw error;
  }

  private async getUserPresenceKey() {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user?.id || 'anonymous';
  }

  private async updatePresence(roomId: string) {
    const channel = this.channels.get(roomId);
    if (!channel) return;

    const presence = channel.presenceState();
    // Handle presence updates
  }

  leaveRoom(roomId: string) {
    const channel = this.channels.get(roomId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(roomId);
      this.messageHandlers.delete(roomId);
    }
  }

  dispose() {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.messageHandlers.clear();
  }
}
