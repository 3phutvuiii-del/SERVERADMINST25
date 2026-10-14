import { NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';
import { getAuditLogsFromDb } from '@/lib/db/mysql';
import { getHealthDeducted } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export interface ActivityEvent {
  id: string;
  category:
    | 'all'
    | 'logins'
    | 'logouts'
    | 'kills'
    | 'gambling'
    | 'coins'
    | 'audit'
    | 'admin'
    | 'panel'
    | 'anti-cheat'
    | 'chat'
    | 'garage'
    | 'shop'
    | 'teleport'
    | 'self-slay'
    | 'dino-sold'
    | 'mutations'
    | 'tokens';
  title: string;
  description: string;
  actorName?: string;
  actorSteamId?: string;
  actorSpecies?: string;
  targetName?: string;
  targetSteamId?: string;
  species?: string;
  growth?: number;
  hpDeducted?: number;
  damageDealt?: number;
  hitLocation?: string;
  flaggedSuspicious?: boolean;
  violationReason?: string;
  coordinates?: { x: number; y: number; z: number };
  severity?: 'normal' | 'warning' | 'critical';
  timestamp: string;
  raw?: any;
}

export async function GET() {
  try {
    const events: ActivityEvent[] = [];

    // 1. Fetch live killfeed from IslePilot API
    const kills = await islePilotClient.getKillfeed();
    for (const k of kills) {
      const isPvp = k.cause === 'player' || !!k.killerName;
      const hp = getHealthDeducted(k.victimSpecies, k.victimGrowth, k.damageDealt);

      // Add to Kills or Self-slay
      events.push({
        id: `kill-${k.id}`,
        category: isPvp ? 'kills' : 'self-slay',
        title: isPvp
          ? `${k.killerName || 'Kẻ thù'} hạ gục ${k.victimName}`
          : `${k.victimName} tử vong do ${k.cause}`,
        description: isPvp
          ? `${k.killerSpecies || 'Dino'} cắn hạ ${k.victimSpecies} (${((k.victimGrowth || 0.5) * 100).toFixed(0)}% Growth).`
          : `Tử vong do môi trường (${k.victimSpecies} ${(k.victimGrowth * 100).toFixed(0)}%).`,
        actorName: k.killerName || undefined,
        actorSteamId: k.killerSteamId || undefined,
        actorSpecies: k.killerSpecies || undefined,
        targetName: k.victimName,
        targetSteamId: k.victimSteamId,
        species: k.victimSpecies,
        growth: k.victimGrowth,
        hpDeducted: hp,
        damageDealt: k.damageDealt,
        hitLocation: k.hitLocation,
        flaggedSuspicious: k.flaggedSuspicious,
        violationReason: k.violationReason,
        coordinates: k.coordinates,
        severity: k.flaggedSuspicious ? 'critical' : isPvp ? 'warning' : 'normal',
        timestamp: k.emittedAt,
        raw: k,
      });

      // If suspicious, also register under Anti-cheat
      if (k.flaggedSuspicious) {
        events.push({
          id: `ac-${k.id}`,
          category: 'anti-cheat',
          title: `Cảnh báo gian lận PvP: ${k.killerName || 'Không xác định'}`,
          description: `Gắn cờ nghi vấn: ${k.violationReason || 'Sát thương hoặc độ trễ bất thường'}. Nạn nhân: ${k.victimName}.`,
          actorName: k.killerName || undefined,
          targetName: k.victimName,
          species: k.victimSpecies,
          growth: k.victimGrowth,
          hpDeducted: hp,
          flaggedSuspicious: true,
          violationReason: k.violationReason,
          severity: 'critical',
          timestamp: k.emittedAt,
          raw: k,
        });
      }
    }

    // 2. Fetch live audit logs from MySQL database
    const auditLogs = await getAuditLogsFromDb();
    for (const a of auditLogs) {
      let cat: ActivityEvent['category'] = 'admin';
      const actionUpper = a.action.toUpperCase();

      if (actionUpper.includes('TELEPORT')) cat = 'teleport';
      else if (actionUpper.includes('INJECT') || actionUpper.includes('GARAGE') || actionUpper.includes('SWAP')) cat = 'garage';
      else if (actionUpper.includes('COIN') || actionUpper.includes('CURRENCY')) cat = 'coins';
      else if (actionUpper.includes('TOKEN')) cat = 'tokens';
      else if (actionUpper.includes('PANEL') || actionUpper.includes('AUTH') || actionUpper.includes('LOGIN')) cat = 'panel';
      else if (actionUpper.includes('MUTATION')) cat = 'mutations';
      else if (actionUpper.includes('BAN') || actionUpper.includes('KICK') || actionUpper.includes('SLAY') || actionUpper.includes('WARN')) cat = 'audit';

      events.push({
        id: `audit-${a.id}`,
        category: cat,
        title: `Lệnh Admin: ${a.action}`,
        description: `Thực hiện bởi ${a.actorName} trên ${a.targetName || a.targetSteamId || 'Hệ thống'}. Lý do: ${a.reason}`,
        actorName: a.actorName,
        targetName: a.targetName,
        targetSteamId: a.targetSteamId,
        severity: a.status === 'FAILED' ? 'critical' : 'normal',
        timestamp: a.createdAt,
        raw: a,
      });
    }

    // 3. Fetch players for login and logout events
    const players = await islePilotClient.getPlayers(false);
    for (const p of players) {
      if (p.online) {
        events.push({
          id: `login-${p.steamId}-${p.lastSeenAt}`,
          category: 'logins',
          title: `Người chơi kết nối: ${p.name}`,
          description: `Đang sinh tồn bằng ${p.species} (${((p.growth || 0.5) * 100).toFixed(0)}% Growth). Máu: ${p.health}/${p.maxHealth}.`,
          targetName: p.name,
          targetSteamId: p.steamId,
          species: p.species,
          growth: p.growth,
          timestamp: p.lastSeenAt,
          raw: p,
        });
      } else {
        events.push({
          id: `logout-${p.steamId}-${p.lastSeenAt}`,
          category: 'logouts',
          title: `Người chơi đăng xuất: ${p.name}`,
          description: `Đã lưu trạng thái an toàn loài ${p.species} (${((p.growth || 0.5) * 100).toFixed(0)}%).`,
          targetName: p.name,
          targetSteamId: p.steamId,
          species: p.species,
          growth: p.growth,
          timestamp: p.lastSeenAt,
          raw: p,
        });
      }
    }



    // Sort newest first
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({ events });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
