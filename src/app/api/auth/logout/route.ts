import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Đã đăng xuất khỏi phiên làm việc quản trị',
  });
  clearSessionCookie(response);
  return response;
}
