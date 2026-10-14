import { NextRequest, NextResponse } from 'next/server';
import { verifySteamOpenId, resolveAdminRoleForSteamId } from '@/lib/auth/steam';
import { setSessionCookie, AuthSessionData } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const host = request.headers.get('host') || 'localhost:3000';
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

    // Convert searchParams to plain object
    const queryObj: Record<string, string> = {};
    searchParams.forEach((val, key) => {
      queryObj[key] = val;
    });

    // 1. Verify cryptographic assertion with Steam
    const verification = await verifySteamOpenId(queryObj);

    if (!verification.success || !verification.steamId) {
      console.warn('[SteamAuth] Verification failed:', verification.error);
      const errorUrl = new URL('/', appUrl);
      errorUrl.searchParams.set('auth_error', verification.error || 'Xác thực Steam thất bại');
      return NextResponse.redirect(errorUrl);
    }

    const steamId = verification.steamId;

    // 2. Resolve Admin Role & Discord Link from IslePilot
    const resolved = await resolveAdminRoleForSteamId(steamId);

    // 3. Create Session Data
    const sessionData: AuthSessionData = {
      id: `steam-${steamId}`,
      steamId,
      username: resolved.name,
      avatarUrl: resolved.avatarUrl,
      role: resolved.role,
      discordId: resolved.discord?.id,
      discordUsername: resolved.discord?.name,
      discordRoles: resolved.discord?.roles,
      issuedAt: Date.now(),
    };

    // 4. Set Session Cookie & Redirect Home
    const redirectUrl = new URL('/', appUrl);
    redirectUrl.searchParams.set('auth_success', '1');
    redirectUrl.searchParams.set('role', resolved.role);

    const response = NextResponse.redirect(redirectUrl);
    setSessionCookie(response, sessionData);

    return response;
  } catch (error: any) {
    console.error('[SteamAuth] Callback error:', error);
    const host = request.headers.get('host') || 'localhost:3000';
    const redirectUrl = new URL('/', `http://${host}`);
    redirectUrl.searchParams.set('auth_error', error.message || 'Lỗi xử lý xác thực');
    return NextResponse.redirect(redirectUrl);
  }
}
