import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from './supabase/client';

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export const createCheckoutSession = async (priceId: string) => {
  try {
    // Get current session
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ priceId })
    });

    const { sessionId, error } = await response.json();
    if (error) throw new Error(error);

    const stripe = await getStripe();
    if (!stripe) throw new Error('Stripe not initialized');

    const { error: stripeError } = await stripe.redirectToCheckout({
      sessionId
    });
    if (stripeError) throw stripeError;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};

export const createPortalSession = async () => {
  try {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    const response = await fetch('/api/create-portal-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: user.id
      })
    });

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
