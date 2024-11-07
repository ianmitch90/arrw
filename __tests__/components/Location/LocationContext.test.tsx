import { render, act, waitFor } from '@testing-library/react';
import { LocationProvider, useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } } })
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockReturnValue({ error: null }),
      select: jest.fn().mockReturnValue({ data: null, error: null })
    })
  }
}));

describe('LocationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides location context', () => {
    const TestComponent = () => {
      const { state } = useLocation();
      return <div>{state.locationPermission}</div>;
    };

    const { getByText } = render(
      <LocationProvider>
        <TestComponent />
      </LocationProvider>
    );

    expect(getByText('prompt')).toBeInTheDocument();
  });

  it('updates location', async () => {
    const TestComponent = () => {
      const { state, updateLocation } = useLocation();
      return (
        <button onClick={() => updateLocation({ latitude: 0, longitude: 0 })}>
          Update
        </button>
      );
    };

    const { getByText } = render(
      <LocationProvider>
        <TestComponent />
      </LocationProvider>
    );

    await act(async () => {
      getByText('Update').click();
    });

    expect(supabase.from).toHaveBeenCalledWith('profiles');
  });

  it('handles travel mode', () => {
    const TestComponent = () => {
      const { state, enableTravelMode } = useLocation();
      return (
        <button onClick={() => enableTravelMode(true)}>
          {state.travelMode ? 'Enabled' : 'Disabled'}
        </button>
      );
    };

    const { getByText } = render(
      <LocationProvider>
        <TestComponent />
      </LocationProvider>
    );

    act(() => {
      getByText('Disabled').click();
    });

    expect(getByText('Enabled')).toBeInTheDocument();
  });
});
