import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange,
  deleteProductRecord,
  deletePriceRecord
} from '@/utils/supabase/admin';

interface WebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

interface WebhookError {
  message?: string;
  code?: string;
}

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]);

export async function POST(req: Request) {
  const body = await req.text();
  const event: WebhookEvent = JSON.parse(body);
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let stripeEvent: Stripe.Event;

  try {
    if (!sig || !webhookSecret)
      return new Response('Webhook secret not found.', { status: 400 });
    stripeEvent = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`🔔  Webhook received: ${stripeEvent.type}`);
  } catch (err: unknown) {
    const error = err as WebhookError;
    console.log(`❌ Error message: ${error?.message}`);
    return new Response(`Webhook Error: ${error?.message}`, { status: 400 });
  }

  if (relevantEvents.has(stripeEvent.type)) {
    try {
      switch (stripeEvent.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProductRecord(stripeEvent.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPriceRecord(stripeEvent.data.object as Stripe.Price);
          break;
        case 'price.deleted':
          await deletePriceRecord(stripeEvent.data.object as Stripe.Price);
          break;
        case 'product.deleted':
          await deleteProductRecord(stripeEvent.data.object as Stripe.Product);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          {
            const subscription = stripeEvent.data.object as Stripe.Subscription;
            await manageSubscriptionStatusChange(
              subscription.id,
              subscription.customer as string,
              stripeEvent.type === 'customer.subscription.created'
            );
          }
          break;
        case 'checkout.session.completed':
          {
            const checkoutSession = stripeEvent.data.object as Stripe.Checkout.Session;
            if (checkoutSession.mode === 'subscription') {
              const subscriptionId = checkoutSession.subscription;
              await manageSubscriptionStatusChange(
                subscriptionId as string,
                checkoutSession.customer as string,
                true
              );
            }
          }
          break;
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error: unknown) {
      const err = error as WebhookError;
      console.log(err);
      return new Response(
        'Webhook handler failed. View your Next.js function logs.',
        {
          status: 400
        }
      );
    }
  } else {
    return new Response(`Unsupported event type: ${stripeEvent.type}`, {
      status: 400
    });
  }
  return new Response(JSON.stringify({ received: true }));
}
