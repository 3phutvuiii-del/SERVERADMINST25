import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';


export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;
    const rawGarage = await islePilotClient.getPlayerGarage(steamId);
    const garage = rawGarage.map((slot) => ({
      ...slot,
      // Preserve exact slot mutations array (including 'None' or empty slots)
      mutations: Array.isArray(slot.mutations) ? slot.mutations : [],
    }));

    return NextResponse.json({ garage });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
