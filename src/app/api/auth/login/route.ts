import { NextRequest, NextResponse } from 'next/server';
import { ROLE_PASSCODES, setSessionCookie, AuthSessionData } from '@/lib/auth/session';
import { AdminRole } from '@/types/islepilot';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passcode, username = 'Admin' } = body;

    if (!passcode) {
      return NextResponse.json(
        { error: 'Vui lòng nhập mật mã quản trị viên (Admin Passcode)' },
        { status: 400 }
      );
    }

    const trimmed = String(passcode).trim();
    let detectedRole: AdminRole | null = null;

    // Check against configured passcodes
    if (trimmed === ROLE_PASSCODES.SUPER_ADMIN) {
      detectedRole = 'SUPER_ADMIN';
    } else if (trimmed === ROLE_PASSCODES.SENIOR_ADMIN) {
      detectedRole = 'SENIOR_ADMIN';
    } else if (trimmed === ROLE_PASSCODES.MODERATOR) {
      detectedRole = 'MODERATOR';
    } else if (trimmed === ROLE_PASSCODES.TRIAL_MOD) {
      detectedRole = 'TRIAL_MOD';
    }

    if (!detectedRole) {
      return NextResponse.json(
        { error: 'Mật mã quản trị không chính xác hoặc đã hết hiệu lực!' },
        { status: 401 }
      );
    }

    const sessionData: AuthSessionData = {
      id: `admin-${Date.now()}`,
      username: username.trim() || 'Admin',
      role: detectedRole,
      issuedAt: Date.now(),
    };

    const response = NextResponse.json({
      success: true,
      message: `Đăng nhập thành công với vai trò ${detectedRole}`,
      session: sessionData,
    });

    setSessionCookie(response, sessionData);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
