import { NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const kills = await islePilotClient.getKillfeed();
    return NextResponse.json({ kills });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
