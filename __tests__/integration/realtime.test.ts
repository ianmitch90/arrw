import { render, act, waitFor } from '@testing-library/react';
import { supabase } from '@/utils/supabase/client';
import { PresenceSystem } from '@/utils/realtime/presence-system';
import { LocationProvider } from '@/contexts/LocationContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

describe('Realtime Integration Tests', () => {
  let presenceSystem: PresenceSystem;
  const mockLocationState = {
    currentLocation: { latitude: 0, longitude: 0 },
    privacySettings: { shareLocation: true }
  };

  beforeEach(() => {
    presenceSystem = new PresenceSystem();
  });

  afterEach(() => {
    presenceSystem.dispose();
  });

  it('handles presence updates with location', async () => {
    const mockUserId = 'test-user';

    await act(async () => {
      await presenceSystem.initialize(mockUserId, mockLocationState);
    });

    const presenceChannel = supabase.channel('presence');

    await waitFor(() => {
      expect(presenceChannel.track).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          location: mockLocationState.currentLocation
        })
      );
    });
  });

  it('enforces rate limits', async () => {
    const mockUserId = 'test-user';

    // Attempt to exceed rate limit
    const promises = Array(150)
      .fill(null)
      .map(() => presenceSystem.initialize(mockUserId, mockLocationState));

    await expect(Promise.all(promises)).rejects.toThrow('Rate limit exceeded');
  });

  it('respects privacy settings', async () => {
    const privateLocationState = {
      ...mockLocationState,
      privacySettings: { shareLocation: false }
    };

    await act(async () => {
      await presenceSystem.initialize('private-user', privateLocationState);
    });

    const { data } = await supabase
      .from('presence_state')
      .select('location')
      .single();

    expect(data.location).toBeNull();
  });
});
