import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/utils/supabase/client';
import { Message, RealtimeMessageHandler } from '@/types/realtime.types';

export class MessagingSystem {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers: Map<string, Set<RealtimeMessageHandler>> = new Map();

  async joinRoom(
    roomId: string,
    handler: RealtimeMessageHandler
  ): Promise<void> {
    if (this.channels.has(roomId)) {
      // Add handler to existing channel
      const handlers = this.messageHandlers.get(roomId) || new Set();
      handlers.add(handler);
      this.messageHandlers.set(roomId, handlers);
      return;
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true },
        presence: {
          key: await this.getUserPresenceKey()
        }
      }
    });

    channel
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        const handlers = this.messageHandlers.get(roomId);
        if (handlers) {
          handlers.forEach((h) => h(payload as Message));
        }
      })
      .subscribe();

    this.channels.set(roomId, channel);
    this.messageHandlers.set(roomId, new Set([handler]));
  }

  async sendMessage(
    roomId: string,
    message: Omit<Message, 'id' | 'created_at'>
  ): Promise<void> {
    const channel = this.channels.get(roomId);
    if (!channel) {
      throw new Error('Not joined to room');
    }

    await channel.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        ...message,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString()
      }
    });
  }

  leaveRoom(roomId: string): void {
    const channel = this.channels.get(roomId);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(roomId);
      this.messageHandlers.delete(roomId);
    }
  }

  private async getUserPresenceKey(): Promise<string> {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    return user?.id || 'anonymous';
  }

  dispose(): void {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.messageHandlers.clear();
  }
}
