import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET() {
  try {
    const headersList = await headers();
    const clientIP = headersList.get('x-forwarded-for') || 'unknown';

    // Skip VPN check in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({ isVpn: false });
    }

    const response = await fetch(`https://v2.api.iphub.info/ip/${clientIP}`, {
      headers: {
        'X-Key': process.env.IPHUB_API_KEY || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check VPN status');
    }

    const data = await response.json();
    return NextResponse.json({ isVpn: data.block === 1 });
  } catch (error) {
    console.error('VPN check error:', error);
    return NextResponse.json({ isVpn: false, error: 'Failed to check VPN status' });
  }
}
