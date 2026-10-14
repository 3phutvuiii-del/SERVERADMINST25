import { NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const bans = await islePilotClient.getBans();
    return NextResponse.json({ bans, total: bans.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
