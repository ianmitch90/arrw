export type SubscriptionTier = 'free' | 'regular' | 'premium';

export interface SubscriptionFeature {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  limits?: {
    amount: number;
    period: 'daily' | 'monthly';
  };
}

export interface FeatureUsage {
  used: number;
  remaining: number;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
}

export interface SubscriptionState {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due';
  features: SubscriptionFeature[];
  usage: Record<string, FeatureUsage>;
  billingPeriod: BillingPeriod;
  autoRenew: boolean;
}

export interface SubscriptionContextType {
  state: SubscriptionState;
  checkFeatureAccess: (featureId: string) => Promise<boolean>;
  trackUsage: (featureId: string, amount?: number) => Promise<void>;
  getRemainingUsage: (featureId: string) => Promise<number>;
  upgradeTier: (tier: SubscriptionTier) => Promise<void>;
  cancelSubscription: () => Promise<void>;
}

export interface SubscriptionPriceMetadata {
  tier: SubscriptionTier;
  features: string[];
  limits: Record<string, number>;
}
