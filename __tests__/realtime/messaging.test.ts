import { RealtimeMessaging } from '@/utils/realtime/messaging';
import { supabase } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue(null),
      unsubscribe: jest.fn()
    }),
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null })
    }),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  }
}));

describe('RealtimeMessaging', () => {
  let messaging: RealtimeMessaging;

  beforeEach(() => {
    messaging = new RealtimeMessaging();
    jest.clearAllMocks();
  });

  it('joins a chat room', async () => {
    const onMessage = jest.fn();
    await messaging.joinRoom('test-room', onMessage);

    expect(supabase.channel).toHaveBeenCalledWith(
      'room:test-room',
      expect.any(Object)
    );
  });

  it('sends a message', async () => {
    await messaging.sendMessage('test-room', 'Hello world');

    expect(supabase.from).toHaveBeenCalledWith('messages');
    expect(supabase.from('messages').insert).toHaveBeenCalledWith({
      room_id: 'test-room',
      sender_id: 'test-user',
      content: 'Hello world',
      attachments: undefined
    });
  });

  it('leaves a room', async () => {
    const onMessage = jest.fn();
    await messaging.joinRoom('test-room', onMessage);
    messaging.leaveRoom('test-room');

    const channel = supabase.channel('room:test-room');
    expect(channel.unsubscribe).toHaveBeenCalled();
  });
});
