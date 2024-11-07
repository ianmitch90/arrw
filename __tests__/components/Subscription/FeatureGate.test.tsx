import { render, fireEvent } from '@testing-library/react';
import { FeatureGate } from '@/components/ui/Subscription/FeatureGate';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';

// Mock the subscription context
jest.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: jest.fn().mockReturnValue({
    state: {
      tier: 'free',
      features: [{ id: 'test-feature', tier: 'free' }]
    },
    checkFeatureAccess: jest.fn().mockResolvedValue(true),
    upgradeTier: jest.fn()
  }),
  SubscriptionProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )
}));

describe('FeatureGate', () => {
  it('renders children when feature is accessible', async () => {
    const { getByText } = render(
      <SubscriptionProvider>
        <FeatureGate featureId="test-feature">
          <div>Protected Content</div>
        </FeatureGate>
      </SubscriptionProvider>
    );

    expect(getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders upgrade prompt when feature is not accessible', async () => {
    const mockCheckFeatureAccess = jest.fn().mockResolvedValue(false);
    (useSubscription as jest.Mock).mockReturnValue({
      state: { tier: 'free' },
      checkFeatureAccess: mockCheckFeatureAccess,
      upgradeTier: jest.fn()
    });

    const { getByText } = render(
      <SubscriptionProvider>
        <FeatureGate featureId="premium-feature">
          <div>Premium Content</div>
        </FeatureGate>
      </SubscriptionProvider>
    );

    expect(getByText(/requires a paid subscription/i)).toBeInTheDocument();
  });

  it('calls upgradeTier when upgrade button is clicked', async () => {
    const mockUpgradeTier = jest.fn();
    (useSubscription as jest.Mock).mockReturnValue({
      state: { tier: 'free' },
      checkFeatureAccess: jest.fn().mockResolvedValue(false),
      upgradeTier: mockUpgradeTier
    });

    const { getByRole } = render(
      <SubscriptionProvider>
        <FeatureGate featureId="premium-feature">
          <div>Premium Content</div>
        </FeatureGate>
      </SubscriptionProvider>
    );

    fireEvent.click(getByRole('button', { name: /upgrade subscription/i }));
    expect(mockUpgradeTier).toHaveBeenCalledWith('regular');
  });
});
