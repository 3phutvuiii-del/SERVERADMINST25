import { NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const hits = await islePilotClient.getCombatLogs();
    return NextResponse.json({ hits, total: hits.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
