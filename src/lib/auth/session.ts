import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AdminRole, AdminUserSession } from '@/types/islepilot';

const COOKIE_NAME = 'st25_admin_session';

// Passcodes for each tier (from env or defaults)
export const ROLE_PASSCODES: Record<Exclude<AdminRole, 'GUEST'>, string> = {
  SUPER_ADMIN: process.env.ADMIN_SUPER_KEY || 'st25_superadmin_2026',
  SENIOR_ADMIN: process.env.ADMIN_SENIOR_KEY || 'st25_senior_2026',
  MODERATOR: process.env.ADMIN_MOD_KEY || 'st25_mod_2026',
  TRIAL_MOD: process.env.ADMIN_TRIAL_KEY || 'st25_trial_2026',
};


const SECRET = process.env.ADMIN_SUPER_KEY || 'st25_super_secure_secret_hash_2026';

export interface AuthSessionData {
  id: string;
  username: string;
  role: AdminRole;
  steamId?: string;
  avatarUrl?: string;
  discordId?: string;
  discordUsername?: string;
  discordRoles?: string[];
  issuedAt: number;
}

/**
 * Sign session data into a tamper-proof string
 */
export function signSession(data: AuthSessionData): string {
  const jsonStr = JSON.stringify(data);
  const base64Data = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(base64Data)
    .digest('base64url');
  return `${base64Data}.${signature}`;
}

/**
 * Verify signed session string
 */
export function verifySession(token: string): AuthSessionData | null {
  try {
    const [base64Data, signature] = token.split('.');
    if (!base64Data || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', SECRET)
      .update(base64Data)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    const data: AuthSessionData = JSON.parse(jsonStr);

    // Session valid for 7 days
    if (Date.now() - data.issuedAt > 7 * 24 * 3600 * 1000) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Get current server-side authenticated admin session
 */
export async function getServerAdminSession(): Promise<AuthSessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) {
    // Default fallback to SuperAdmin for initial preview if no cookie yet
    return null;
  }
  return verifySession(token);
}

/**
 * Set session cookie helper
 */
export function setSessionCookie(response: NextResponse, session: AuthSessionData): void {
  const token = signSession(session);
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600, // 7 days
  });
}

/**
 * Clear session cookie helper
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(COOKIE_NAME);
}
