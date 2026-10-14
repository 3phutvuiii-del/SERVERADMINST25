import { NextRequest, NextResponse } from 'next/server';
import {
  getAnnouncementTemplatesFromDb,
  saveAnnouncementTemplateToDb,
  deleteAnnouncementTemplateFromDb,
  getBroadcastHistoryFromDb,
  addBroadcastHistoryToDb,
  addAuditLogToDb,
} from '@/lib/db/mysql';
import { islePilotClient } from '@/lib/islepilot/client';
import {
  processAutoBroadcastTick,
  triggerNextBroadcastNow,
  startAutoAnnouncerScheduler,
} from '@/lib/islepilot/autoAnnouncer';
import { getServerAdminSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

// Ensure scheduler is active
startAutoAnnouncerScheduler();

export async function GET() {
  try {
    // Process tick if due
    await processAutoBroadcastTick().catch(() => {});

    const templates = await getAnnouncementTemplatesFromDb();
    const history = await getBroadcastHistoryFromDb();
    const config = {
      enabled: false,
      intervalMinutes: 30,
      mode: 'sequential',
    };

    return NextResponse.json({
      success: true,
      templates,
      config,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerAdminSession();
    if (!session || session.role === 'GUEST') {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu đăng nhập BQT trước khi phát sóng hoặc cài đặt thông báo!' },
        { status: 401 }
      );
    }

    const actorName = session.username;
    const actorRole = session.role;

    const { hasPermission } = await import('@/lib/auth/rbac');
    if (!hasPermission(actorRole, 'canBroadcast')) {
      return NextResponse.json(
        { success: false, error: 'Từ chối truy cập: Bạn không có quyền phát sóng thông báo (canBroadcast)' },
        { status: 403 }
      );
    }


    const body = await request.json();
    const { action, payload } = body;

    switch (action) {
      case 'send_now': {
        const message = payload?.message?.trim();
        if (!message) {
          return NextResponse.json(
            { success: false, error: 'Nội dung thông báo không được để trống' },
            { status: 400 }
          );
        }

        const res = await islePilotClient.announceServer(message);

        const broadcastId = `bcast_${Date.now()}`;
        await addBroadcastHistoryToDb({
          id: broadcastId,
          content: message,
          source: 'manual',
          senderName: actorName,
          status: res.success ? 'SUCCESS' : 'FAILED',
          sentAt: new Date().toISOString(),
        });

        await addAuditLogToDb({
          id: `audit_${Date.now()}`,
          actorName,
          actorRole,
          action: 'BROADCAST_MANUAL',
          details: { message },
          status: res.success ? 'SUCCESS' : 'FAILED',
        });

        return NextResponse.json({
          success: res.success,
          message: res.message || 'Đã gửi thông báo tới máy chủ',
        });
      }

      case 'save_template': {
        const { id, title, content, category, enabledForAuto } = payload || {};
        if (!title?.trim() || !content?.trim()) {
          return NextResponse.json(
            { success: false, error: 'Tiêu đề và nội dung mẫu không được để trống' },
            { status: 400 }
          );
        }

        const templateId = id || `tpl_${Date.now()}`;
        const templateObj = {
          id: templateId,
          title: title.trim(),
          content: content.trim(),
          category: category || 'general',
          enabledForAuto: enabledForAuto !== false,
          createdAt: new Date().toISOString(),
        };

        await saveAnnouncementTemplateToDb(templateObj);

        return NextResponse.json({
          success: true,
          template: templateObj,
          message: id ? 'Cập nhật mẫu thành công' : 'Tạo mẫu mới thành công',
        });
      }

      case 'delete_template': {
        const { id } = payload || {};
        if (!id) {
          return NextResponse.json(
            { success: false, error: 'Thiếu ID mẫu để xóa' },
            { status: 400 }
          );
        }

        const deleted = await deleteAnnouncementTemplateFromDb(id);
        return NextResponse.json({
          success: deleted,
          message: deleted ? 'Đã xóa mẫu thông báo' : 'Không tìm thấy mẫu thông báo',
        });
      }

      case 'update_config': {
        const { enabled, intervalMinutes, mode } = payload || {};
        await addAuditLogToDb({
          id: `audit_${Date.now()}`,
          actorName,
          actorRole,
          action: 'AUTO_ANNOUNCE_CONFIG',
          details: { enabled, intervalMinutes, mode },
          status: 'SUCCESS',
        });

        return NextResponse.json({
          success: true,
          config: {
            enabled: Boolean(enabled),
            intervalMinutes: intervalMinutes || 30,
            mode: mode || 'sequential',
          },
          message: 'Cập nhật cấu hình tự động thông báo thành công',
        });
      }

      case 'trigger_next': {
        const result = await triggerNextBroadcastNow(actorName);
        return NextResponse.json({
          success: result.success,
          message: `Đã gửi mẫu "${result.templateTitle}" ngay lập tức`,
          content: result.content,
        });
      }

      case 'clear_history': {
        try {
          const { getDbPool } = await import('@/lib/db/mysql');
          const pool = getDbPool();
          await pool.query('DELETE FROM `broadcast_history`');
        } catch (e) {
          console.warn('Failed to clear broadcast history:', e);
        }
        return NextResponse.json({
          success: true,
          message: 'Đã xóa toàn bộ lịch sử thông báo',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Hành động không hợp lệ: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi xử lý yêu cầu' },
      { status: 500 }
    );
  }
}
