import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';
import { QuestItem } from '@/types/islepilot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const steamId = searchParams.get('steamId')?.trim();

    if (steamId) {
      const quests = await islePilotClient.getPlayerQuests(steamId);
      return NextResponse.json({
        quests,
        mode: 'player',
        steamId,
        total: quests.length,
      });
    }

    // When no steamId is specified (viewing all / catalog),
    // fetch quests using the first available online player or sample player to retrieve the server quests catalog
    let serverQuests: QuestItem[] = [];
    const onlinePlayers = await islePilotClient.getPlayers(true).catch(() => []);
    const probePlayer = onlinePlayers[0] || (await islePilotClient.getPlayers(false).catch(() => []))[0];

    if (probePlayer?.steamId) {
      serverQuests = await islePilotClient.getPlayerQuests(probePlayer.steamId);
    }

    return NextResponse.json({
      quests: serverQuests,
      mode: 'all',
      total: serverQuests.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
