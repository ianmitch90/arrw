import { supabase } from '@/utils/supabase/client';
import { User, Place } from '@/utils/api/data-service';

type UpdateHandler = (data: any) => void;

export class RealtimeService {
  private static channels: Map<string, any> = new Map();
  private static handlers: Map<string, Set<UpdateHandler>> = new Map();

  static async subscribeToPresence(handler: (users: User[]) => void) {
    const channel = supabase
      .channel('presence')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        handler(Object.values(state));
      })
      .subscribe();

    this.channels.set('presence', channel);
    return () => channel.unsubscribe();
  }

  static async subscribeToLocationUpdates(
    latitude: number,
    longitude: number,
    radius: number,
    handler: (places: Place[]) => void
  ) {
    const channel = supabase
      .channel('location_updates')
      .on('broadcast', { event: 'place_update' }, ({ payload }) => {
        handler([payload]);
      })
      .subscribe();

    this.channels.set('location_updates', channel);
    return () => channel.unsubscribe();
  }

  static async subscribeToMessages(
    roomId: string,
    handler: (message: any) => void
  ) {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        handler(payload);
      })
      .subscribe();

    this.channels.set(`room:${roomId}`, channel);
    return () => channel.unsubscribe();
  }

  static cleanup() {
    this.channels.forEach((channel) => channel.unsubscribe());
    this.channels.clear();
    this.handlers.clear();
  }
}
