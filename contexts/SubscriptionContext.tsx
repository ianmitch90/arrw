import { createContext, useContext, useState, useEffect } from 'react';
import {
  SubscriptionState,
  SubscriptionContextType,
  SubscriptionTier
} from '@/types/subscription.types';
import { supabase } from '@/utils/supabase/client';

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined
);

export function SubscriptionProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<SubscriptionState>({
    tier: 'free',
    status: 'active',
    features: [],
    usage: {},
    billingPeriod: {
      start: new Date(),
      end: new Date()
    },
    autoRenew: true
  });

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        *,
        prices (
          products (*)
        )
      `
      )
      .eq('user_id', user.id)
      .single();

    if (subscription) {
      // Update state with subscription data
      setState((prev) => ({
        ...prev,
        tier: subscription.prices.products.metadata.tier,
        status: subscription.status,
        billingPeriod: {
          start: new Date(subscription.current_period_start),
          end: new Date(subscription.current_period_end)
        },
        autoRenew: !subscription.cancel_at_period_end
      }));

      // Load feature usage
      const { data: usage } = await supabase
        .from('usage_records')
        .select('*')
        .eq('subscription_id', subscription.id);

      if (usage) {
        const usageMap = usage.reduce(
          (acc, record) => ({
            ...acc,
            [record.feature_name]: {
              used: record.quantity,
              remaining:
                getFeatureLimit(
                  record.feature_name,
                  subscription.prices.products.metadata.tier
                ) - record.quantity
            }
          }),
          {}
        );

        setState((prev) => ({
          ...prev,
          usage: usageMap
        }));
      }
    }
  };

  const getFeatureLimit = (
    featureId: string,
    tier: SubscriptionTier
  ): number => {
    // Define feature limits based on tier
    const limits: Record<SubscriptionTier, Record<string, number>> = {
      free: {
        'ai-actions': 0,
        'video-duration': 0
      },
      regular: {
        'ai-actions': 10,
        'video-duration': 30
      },
      premium: {
        'ai-actions': 2000,
        'video-duration': 180
      }
    };

    return limits[tier][featureId] || 0;
  };

  const checkFeatureAccess = async (featureId: string): Promise<boolean> => {
    const feature = state.features.find((f) => f.id === featureId);
    if (!feature) return false;

    // Check if feature is available in current tier
    if (feature.tier > state.tier) return false;

    // Check usage limits if applicable
    if (feature.limits) {
      const usage = state.usage[featureId];
      if (!usage) return true;
      return usage.remaining > 0;
    }

    return true;
  };

  const trackUsage = async (featureId: string, amount = 1): Promise<void> => {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!subscription) throw new Error('No active subscription');

    const { error } = await supabase.from('usage_records').insert({
      subscription_id: subscription.id,
      feature_name: featureId,
      quantity: amount
    });

    if (error) throw error;

    // Update local state
    setState((prev) => ({
      ...prev,
      usage: {
        ...prev.usage,
        [featureId]: {
          used: (prev.usage[featureId]?.used || 0) + amount,
          remaining: (prev.usage[featureId]?.remaining || 0) - amount
        }
      }
    }));
  };

  const getRemainingUsage = async (featureId: string): Promise<number> => {
    return state.usage[featureId]?.remaining || 0;
  };

  const upgradeTier = async (tier: SubscriptionTier): Promise<void> => {
    // Implement Stripe checkout
    throw new Error('Not implemented');
  };

  const cancelSubscription = async (): Promise<void> => {
    // Implement subscription cancellation
    throw new Error('Not implemented');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        state,
        checkFeatureAccess,
        trackUsage,
        getRemainingUsage,
        upgradeTier,
        cancelSubscription
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      'useSubscription must be used within a SubscriptionProvider'
    );
  }
  return context;
};
