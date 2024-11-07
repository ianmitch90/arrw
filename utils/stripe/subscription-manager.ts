import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionTier } from '@/types/subscription.types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export class SubscriptionManager {
  static async createCheckoutSession(
    userId: string,
    priceId: string
  ): Promise<string> {
    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Get or create Stripe customer
    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId }
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: { userId }
    });

    return session.id;
  }

  static async handleSubscriptionUpdated(
    subscription: Stripe.Subscription
  ): Promise<void> {
    const userId = subscription.metadata.userId;
    if (!userId) {
      throw new Error('No userId in subscription metadata');
    }

    // Update subscription in database
    const { error } = await supabase.from('subscriptions').upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end
    });

    if (error) {
      throw error;
    }

    // Update user's subscription tier
    await this.updateUserTier(userId, subscription);
  }

  private static async updateUserTier(
    userId: string,
    subscription: Stripe.Subscription
  ): Promise<void> {
    const price = await stripe.prices.retrieve(
      subscription.items.data[0].price.id,
      {
        expand: ['product']
      }
    );

    const tier = (price.product as Stripe.Product).metadata
      .tier as SubscriptionTier;

    const { error } = await supabase
      .from('users')
      .update({ subscription_tier: tier })
      .eq('id', userId);

    if (error) {
      throw error;
    }
  }

  static async cancelSubscription(userId: string): Promise<void> {
    // Get subscription ID
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .single();

    if (error || !subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel subscription in Stripe
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });

    // Update subscription in database
    await supabase
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId);
  }
}
