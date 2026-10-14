import {
  getAnnouncementTemplatesFromDb,
  addBroadcastHistoryToDb,
} from '@/lib/db/mysql';
import { islePilotClient } from '@/lib/islepilot/client';

declare global {
  // eslint-disable-next-line no-var
  var __autoAnnouncerInitialized: boolean | undefined;
  // eslint-disable-next-line no-var
  var __autoAnnouncerTimer: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var __autoAnnounceIndex: number | undefined;
}

export async function processAutoBroadcastTick(): Promise<{
  triggered: boolean;
  message?: string;
  templateTitle?: string;
}> {
  return { triggered: false, message: 'Auto announcer tick idle' };
}

export async function triggerNextBroadcastNow(senderName = 'Admin'): Promise<{
  success: boolean;
  content: string;
  templateTitle: string;
}> {
  const templates = (await getAnnouncementTemplatesFromDb()).filter((t) => t.enabledForAuto);

  if (templates.length === 0) {
    throw new Error('Chưa có mẫu thông báo nào được bật chế độ tự động');
  }

  const currentIndex = global.__autoAnnounceIndex || 0;
  const template = templates[currentIndex % templates.length];
  global.__autoAnnounceIndex = (currentIndex + 1) % templates.length;

  const res = await islePilotClient.announceServer(template.content);

  await addBroadcastHistoryToDb({
    id: `bcast_${Date.now()}`,
    content: template.content,
    source: 'manual',
    senderName,
    status: res.success ? 'SUCCESS' : 'FAILED',
    sentAt: new Date().toISOString(),
  });

  return {
    success: res.success,
    content: template.content,
    templateTitle: template.title,
  };
}

export function startAutoAnnouncerScheduler() {
  if (typeof window !== 'undefined') return;
  if (global.__autoAnnouncerInitialized) return;

  global.__autoAnnouncerInitialized = true;

  if (global.__autoAnnouncerTimer) {
    clearInterval(global.__autoAnnouncerTimer);
  }

  // Check every 15 seconds
  global.__autoAnnouncerTimer = setInterval(() => {
    processAutoBroadcastTick().catch((err) => {
      console.warn('[AutoAnnouncer] Tick error:', err);
    });
  }, 15000);
}

// Auto-start timer on module import
startAutoAnnouncerScheduler();
