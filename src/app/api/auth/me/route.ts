import { NextResponse } from 'next/server';
import { getServerAdminSession } from '@/lib/auth/session';
import { ROLE_PERMISSIONS } from '@/lib/auth/rbac';


export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerAdminSession();
    if (!session) {
      return NextResponse.json({
        authenticated: false,
        session: null,
        permissions: ROLE_PERMISSIONS.GUEST,
      });
    }

    // 1. Base RBAC permissions
    const basePermissions = ROLE_PERMISSIONS[session.role] || ROLE_PERMISSIONS.GUEST;

    // 2. Base & DB-configured RBAC permissions
    let effectivePermissions = { ...basePermissions };
    try {
      const { getRolePermissionsFromDb } = await import('@/lib/db/mysql');
      const dbPerms = await getRolePermissionsFromDb();
      const currentRoleSetting = dbPerms.find((r: any) => r.role === session.role);
      if (currentRoleSetting?.permissions) {
        effectivePermissions = { ...effectivePermissions, ...currentRoleSetting.permissions };
      }
    } catch (e) {
      // Fallback to basePermissions
    }

    const discordRoles = session.discordRoles || [];

    return NextResponse.json({
      authenticated: true,
      session,
      permissions: effectivePermissions,
      discordRoles,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

