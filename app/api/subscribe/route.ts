import { NextResponse } from 'next/server';
import { supabaseClient } from '../../../lib/supabaseClient';
const supabase = supabaseClient();

export async function POST(request: Request) {
  const { subscription, userId } = await request.json();
  const { error } = await supabase
    .from('push_subscriptions')
    .insert({ user_id: userId, subscription: JSON.stringify(subscription) });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
