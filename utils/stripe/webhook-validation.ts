import { Stripe } from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-09-30.acacia'
});

// Create Supabase admin client for secure operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function validateWebhookSignature(
  req: Request
): Promise<Stripe.Event> {
  const payload = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Validate event type
    if (!isValidEventType(event.type)) {
      throw new Error(`Unhandled event type: ${event.type}`);
    }

    return event;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    throw new Error('Invalid webhook signature');
  }
}

export async function validateSubscriptionUpdate(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  // Verify subscription belongs to user
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (error || !data) {
    throw new Error('Invalid subscription update attempt');
  }

  // Additional validation checks
  if (!isValidSubscriptionStatus(subscription.status)) {
    throw new Error(`Invalid subscription status: ${subscription.status}`);
  }
}

function isValidEventType(type: string): boolean {
  const validEvents = [
    'checkout.session.completed',
    'customer.subscription.updated',
    'customer.subscription.deleted',
    'invoice.payment_succeeded',
    'invoice.payment_failed'
  ];
  return validEvents.includes(type);
}

function isValidSubscriptionStatus(status: string): boolean {
  const validStatuses = [
    'active',
    'past_due',
    'canceled',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'unpaid'
  ];
  return validStatuses.includes(status);
}
