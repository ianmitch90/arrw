import { supabase } from './supabase/client';

export interface UsageMetrics {
  featureId: string;
  used: number;
  remaining: number;
  resetDate?: Date;
}

export class UsageTracker {
  static async trackUsage(featureId: string, amount = 1): Promise<void> {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .single();

    if (!subscription) throw new Error('No active subscription');
    if (subscription.status !== 'active')
      throw new Error('Subscription not active');

    // Record usage
    const { error: usageError } = await supabase.from('usage_records').insert({
      subscription_id: subscription.id,
      feature_name: featureId,
      quantity: amount
    });

    if (usageError) throw usageError;
  }

  static async getUsageMetrics(
    featureId: string
  ): Promise<UsageMetrics | null> {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select(
        `
        id,
        status,
        prices (
          products (
            metadata
          )
        )
      `
      )
      .eq('user_id', user.id)
      .single();

    if (!subscription) return null;

    // Get total usage for this feature
    const { data: usage } = await supabase
      .from('usage_records')
      .select('quantity')
      .eq('subscription_id', subscription.id)
      .eq('feature_name', featureId);

    const totalUsed =
      usage?.reduce((sum, record) => sum + record.quantity, 0) || 0;
    const limit =
      subscription.prices.products.metadata.limits?.[featureId] || 0;

    return {
      featureId,
      used: totalUsed,
      remaining: Math.max(0, limit - totalUsed),
      resetDate: new Date(subscription.current_period_end)
    };
  }

  static async checkUsageLimit(
    featureId: string,
    amount = 1
  ): Promise<boolean> {
    const metrics = await this.getUsageMetrics(featureId);
    if (!metrics) return false;
    return metrics.remaining >= amount;
  }
}
