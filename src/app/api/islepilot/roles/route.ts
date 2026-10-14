import { NextRequest, NextResponse } from 'next/server';
import {
  getRolePermissionsFromDb,
  saveRolePermissionToDb,
  getSteamRoleAssignmentsFromDb,
  saveSteamRoleAssignmentToDb,
  removeSteamRoleAssignmentFromDb,
  addAuditLogToDb,
} from '@/lib/db/mysql';
import { DEFAULT_ST25_ROLES } from '@/lib/db/store';
import { getServerAdminSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/rbac';
import { islePilotClient } from '@/lib/islepilot/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steamId');

    const roles = await getRolePermissionsFromDb();

    if (steamId) {
      const player = await islePilotClient.getPlayerDetail(steamId);
      const discordRoles = player?.discord?.roles || [];

      return NextResponse.json({
        success: true,
        roles,
        playerSimulation: {
          steamId,
          name: player?.name,
          discord: player?.discord,
          discordRoles,
        },
      });
    }

    const steamRoleAssignments = await getSteamRoleAssignmentsFromDb();

    return NextResponse.json(
      {
        success: true,
        roles,
        defaults: DEFAULT_ST25_ROLES,
        steamRoleAssignments,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAdminSession();
    if (!session || session.role === 'GUEST') {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập tài khoản BQT trước khi cấu hình phân quyền hệ thống!' },
        { status: 401 }
      );
    }

    const actorRole = session.role;
    if (!hasPermission(actorRole, 'canManageRoles')) {
      return NextResponse.json(
        { success: false, error: 'Từ chối truy cập: Bạn không có quyền quản lý phân quyền hệ thống (canManageRoles)' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Cấp quyền trực tiếp theo SteamID
    if (action === 'assign_steam') {
      const { steamId: targetSteamId, role: targetRole, note, playerName: targetName } = body;
      if (!targetSteamId || !targetRole) {
        return NextResponse.json({ success: false, error: 'Thiếu SteamID hoặc Role cần cấp' }, { status: 400 });
      }

      await saveSteamRoleAssignmentToDb({
        steamId: targetSteamId.trim(),
        playerName: targetName,
        role: targetRole,
        note,
        assignedBy: session.username,
        assignedAt: new Date().toISOString(),
      });

      await addAuditLogToDb({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        actorSteamId: session.steamId,
        actorName: session.username || 'SuperAdmin',
        actorRole: session.role,
        action: 'ASSIGN_STEAM_ROLE',
        targetSteamId,
        targetName,
        details: { steamId: targetSteamId, role: targetRole, note, targetName },
        status: 'SUCCESS',
      });

      return NextResponse.json({
        success: true,
        message: `Đã cấp vai trò ${targetRole} cho SteamID ${targetSteamId}`,
        steamRoleAssignments: await getSteamRoleAssignmentsFromDb(),
      });
    }

    // Thu hồi quyền trực tiếp theo SteamID
    if (action === 'remove_steam') {
      const { steamId: targetSteamId } = body;
      if (!targetSteamId) {
        return NextResponse.json({ success: false, error: 'Thiếu SteamID cần thu hồi quyền' }, { status: 400 });
      }

      const ok = await removeSteamRoleAssignmentFromDb(targetSteamId.trim());

      await addAuditLogToDb({
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        actorSteamId: session.steamId,
        actorName: session.username || 'SuperAdmin',
        actorRole: session.role,
        action: 'REMOVE_STEAM_ROLE',
        targetSteamId,
        details: { steamId: targetSteamId },
        status: 'SUCCESS',
      });

      return NextResponse.json({
        success: ok,
        message: ok ? `Đã thu hồi quyền của SteamID ${targetSteamId}` : 'Không tìm thấy SteamID',
        steamRoleAssignments: await getSteamRoleAssignmentsFromDb(),
      });
    }

    // Default: Save / Update role item
    const { roleName, description, badgeColor, permissions } = body;
    if (!roleName || !permissions) {
      return NextResponse.json(
        { success: false, error: 'Thiếu roleName hoặc bảng permissions' },
        { status: 400 }
      );
    }

    await saveRolePermissionToDb({
      roleName: roleName.trim(),
      description: description || '',
      badgeColor: badgeColor || '#3b82f6',
      permissions,
    });

    return NextResponse.json({
      success: true,
      message: `Đã lưu cấu hình phân quyền cho role "${roleName}"`,
      roles: await getRolePermissionsFromDb(),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
