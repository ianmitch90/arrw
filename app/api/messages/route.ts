import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { supabaseClient } from '../../../lib/supabaseClient';
const supabase = supabaseClient();

export async function POST(request: Request) {
  const { message, recipientId } = await request.json();
  const { data, error } = await supabase
    .from('messages')
    .insert({ content: message, recipient_id: recipientId });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true, data });
}
