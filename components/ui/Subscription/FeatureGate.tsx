import { ReactNode } from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@heroui/react';

interface FeatureGateProps {
  featureId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({
  featureId,
  children,
  fallback
}: FeatureGateProps) {
  const { state, checkFeatureAccess, upgradeTier } = useSubscription();

  if (!checkFeatureAccess(featureId)) {
    return (
      fallback || (
        <div className="p-4 border border-warning-200 rounded-lg bg-warning-50">
          <p className="text-warning-700 mb-2">
            This feature requires a {state.tier === 'free' ? 'paid' : 'higher'}{' '}
            subscription.
          </p>
          <Button
            color="warning"
            variant="flat"
            onPress={() =>
              upgradeTier(state.tier === 'free' ? 'regular' : 'premium')
            }
          >
            Upgrade Subscription
          </Button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
