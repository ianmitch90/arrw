import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionManager } from '@/utils/stripe/subscription-manager';
import { validateWebhookSignature } from '@/utils/stripe/webhook-validation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(
  req: Request,
  { params }: { params: { action: string } }
) {
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    switch (params.action) {
      case 'create-checkout':
        const { priceId } = await req.json();
        const sessionId = await SubscriptionManager.createCheckoutSession(
          user.id,
          priceId
        );
        return NextResponse.json({ sessionId });

      case 'cancel':
        await SubscriptionManager.cancelSubscription(user.id);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: 'Subscription operation failed' },
      { status: 500 }
    );
  }
}
