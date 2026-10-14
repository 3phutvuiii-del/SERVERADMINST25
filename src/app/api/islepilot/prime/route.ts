import { NextRequest, NextResponse } from 'next/server';
import { getPrimeMembersFromDb, savePrimeMemberToDb } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const members = await getPrimeMembersFromDb();
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await savePrimeMemberToDb({
      steamId: body.steamId,
      playerName: body.playerName,
      registeredAt: body.registeredAt || new Date().toISOString(),
      primeTier: body.primeTier || body.tier || 'Standard Prime',
      status: body.status || 'active',
    });
    return NextResponse.json({ success: true, member: body });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
