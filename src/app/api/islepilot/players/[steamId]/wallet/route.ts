import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;
    const wallet = await islePilotClient.getPlayerWallet(steamId);
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }
    return NextResponse.json(wallet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
