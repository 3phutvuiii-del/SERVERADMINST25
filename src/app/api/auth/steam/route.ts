import { NextRequest, NextResponse } from 'next/server';
import { getSteamLoginUrl } from '@/lib/auth/steam';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Determine base URL dynamically from request headers or environment
  const host = request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  const loginUrl = getSteamLoginUrl(appUrl);
  return NextResponse.redirect(loginUrl);
}
