import { render, act } from '@testing-library/react';
import { PresenceManager } from '@/components/Presence/PresenceManager';
import { LocationContext } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockResolvedValue(null),
      track: jest.fn().mockResolvedValue(null),
      unsubscribe: jest.fn()
    }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    }
  }
}));

const mockLocationState = {
  currentLocation: { latitude: 0, longitude: 0 },
  selectedCity: null,
  travelMode: false,
  locationPermission: 'granted' as const,
  error: null,
  isLoading: false,
  privacySettings: {
    shareLocation: true,
    showDistance: true,
    allowLocationHistory: true
  }
};

describe('PresenceManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes presence tracking', async () => {
    render(
      <LocationContext.Provider value={{ state: mockLocationState } as any}>
        <PresenceManager />
      </LocationContext.Provider>
    );

    expect(supabase.channel).toHaveBeenCalledWith('presence_updates');
    expect(supabase.channel().subscribe).toHaveBeenCalled();
  });

  it('updates presence when location changes', async () => {
    const { rerender } = render(
      <LocationContext.Provider value={{ state: mockLocationState } as any}>
        <PresenceManager />
      </LocationContext.Provider>
    );

    const newLocation = {
      ...mockLocationState,
      currentLocation: { latitude: 1, longitude: 1 }
    };

    rerender(
      <LocationContext.Provider value={{ state: newLocation } as any}>
        <PresenceManager />
      </LocationContext.Provider>
    );

    expect(supabase.channel().track).toHaveBeenCalledWith(
      expect.objectContaining({
        location: newLocation.currentLocation
      })
    );
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(
      <LocationContext.Provider value={{ state: mockLocationState } as any}>
        <PresenceManager />
      </LocationContext.Provider>
    );

    unmount();
    expect(supabase.channel().unsubscribe).toHaveBeenCalled();
  });
}); 