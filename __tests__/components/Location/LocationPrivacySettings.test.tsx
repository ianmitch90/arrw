import { render, fireEvent, waitFor } from '@testing-library/react';
import { LocationPrivacySettings } from '@/components/ui/Location/LocationPrivacySettings';
import { LocationProvider } from '@/contexts/LocationContext';
import { supabase } from '@/utils/supabase/client';

jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } } })
    },
    from: jest.fn().mockReturnValue({
      update: jest.fn().mockResolvedValue({ error: null }),
      select: jest.fn().mockResolvedValue({ data: null, error: null })
    })
  }
}));

describe('LocationPrivacySettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders privacy settings switches', () => {
    const { getByText } = render(
      <LocationProvider>
        <LocationPrivacySettings />
      </LocationProvider>
    );

    expect(getByText('Share my location')).toBeInTheDocument();
    expect(getByText('Show distance to others')).toBeInTheDocument();
    expect(getByText('Save location history')).toBeInTheDocument();
  });

  it('updates privacy settings when toggled', async () => {
    const { getByRole } = render(
      <LocationProvider>
        <LocationPrivacySettings />
      </LocationProvider>
    );

    const shareLocationSwitch = getByRole('switch', {
      name: /share my location/i
    });
    fireEvent.click(shareLocationSwitch);

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });
});
