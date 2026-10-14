import { NextRequest, NextResponse } from 'next/server';
import { addAuditLogToDb } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('[IslePilot Webhook] Received event:', payload.event || 'unknown', payload);

    await addAuditLogToDb({
      id: `webhook_${Date.now()}`,
      actorName: 'IslePilot Webhook',
      actorRole: 'SUPER_ADMIN',
      action: `WEBHOOK_${(payload.event || 'EVENT').toUpperCase()}`,
      targetSteamId: payload.steamId || payload.victimSteamId,
      targetName: payload.playerName || payload.victimName,
      details: payload,
      status: 'SUCCESS',
    });

    return NextResponse.json({ received: true, event: payload.event });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
