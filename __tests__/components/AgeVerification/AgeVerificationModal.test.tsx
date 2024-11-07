import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgeVerificationModal } from '@/components/ui/AgeVerification';
import { AgeVerificationProvider } from '@/contexts/AgeVerificationContext';
import { supabase, auth } from '@/utils/supabase/client';

// Mock Supabase client
jest.mock('@/utils/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  },
  auth: {
    verifyAge: jest.fn(),
    checkAgeVerification: jest.fn()
  }
}));

describe('AgeVerificationModal', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup default mock responses
    (auth.verifyAge as jest.Mock).mockResolvedValue(true);
    (auth.checkAgeVerification as jest.Mock).mockResolvedValue(false);
  });

  it('renders correctly', () => {
    render(
      <AgeVerificationProvider>
        <AgeVerificationModal />
      </AgeVerificationProvider>
    );

    expect(screen.getByText('Age Verification Required')).toBeInTheDocument();
    expect(
      screen.getByText('I confirm that I am 18 years or older')
    ).toBeInTheDocument();
  });

  it('handles verification flow', async () => {
    render(
      <AgeVerificationProvider>
        <AgeVerificationModal />
      </AgeVerificationProvider>
    );

    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /confirm age/i });

    expect(button).toBeDisabled();

    fireEvent.click(checkbox);
    expect(button).toBeEnabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(auth.verifyAge).toHaveBeenCalledWith('modal');
    });

    await waitFor(() => {
      expect(
        screen.queryByText('Age Verification Required')
      ).not.toBeInTheDocument();
    });
  });

  it('handles verification error', async () => {
    // Mock verification failure
    (auth.verifyAge as jest.Mock).mockRejectedValue(
      new Error('Verification failed')
    );

    render(
      <AgeVerificationProvider>
        <AgeVerificationModal />
      </AgeVerificationProvider>
    );

    const checkbox = screen.getByRole('checkbox');
    const button = screen.getByRole('button', { name: /confirm age/i });

    fireEvent.click(checkbox);
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
    });
  });
});
