import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';
import { getPlayerNotesFromDb, getPlayerProfileFromDb } from '@/lib/db/mysql';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ steamId: string }> }
) {
  try {
    const { steamId } = await params;
    const player = await islePilotClient.getPlayerDetail(steamId);
    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Fetch real garage slots from IslePilot
    const rawGarageSlots = await islePilotClient.getPlayerGarage(steamId).catch(() => []);

    // 1. Garage slots directly from IslePilot (preserving 4 slots array per dino)
    const garageSlots = (rawGarageSlots || []).map((slot) => ({
      ...slot,
      mutations: Array.isArray(slot.mutations) ? slot.mutations : [],
    }));

    // 2. Fetch player admin notes & saved 16-slot lineage profile from MySQL
    const [notes, dbProfile] = await Promise.all([
      getPlayerNotesFromDb(steamId),
      getPlayerProfileFromDb(steamId),
    ]);

    // Attach saved lineage & mutations if present and matching species
    if (dbProfile) {
      if (dbProfile.lineage_mutations) {
        (player as any).lineage = dbProfile.lineage_mutations;
      }
      if (
        (!player.mutations || player.mutations.length === 0) &&
        Array.isArray(dbProfile.active_mutations) &&
        dbProfile.active_mutations.length > 0
      ) {
        player.mutations = dbProfile.active_mutations;
      }
      if (dbProfile.elder && dbProfile.elder !== 'No elder') {
        player.elder = dbProfile.elder as any;
      }
    }

    return NextResponse.json({ player, garage: garageSlots, notes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
