import { render, waitFor } from '@testing-library/react';
import { UsageDisplay } from '@/components/ui/Subscription/UsageDisplay';
import { UsageTracker } from '@/utils/usage-tracking';

jest.mock('@/utils/usage-tracking');

describe('UsageDisplay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays loading state initially', () => {
    const { getByText } = render(<UsageDisplay featureId="test-feature" />);
    expect(getByText('Loading usage...')).toBeInTheDocument();
  });

  it('displays usage metrics when loaded', async () => {
    const mockMetrics = {
      featureId: 'test-feature',
      used: 5,
      remaining: 15,
      resetDate: new Date()
    };

    (UsageTracker.getUsageMetrics as jest.Mock).mockResolvedValue(mockMetrics);

    const { getByText } = render(<UsageDisplay featureId="test-feature" />);

    await waitFor(() => {
      expect(getByText('5 used')).toBeInTheDocument();
      expect(getByText('15 remaining')).toBeInTheDocument();
    });
  });

  it('handles error state gracefully', async () => {
    (UsageTracker.getUsageMetrics as jest.Mock).mockRejectedValue(
      new Error('Failed to load metrics')
    );

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(<UsageDisplay featureId="test-feature" />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading usage metrics:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
