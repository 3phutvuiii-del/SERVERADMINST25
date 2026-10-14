import { NextRequest, NextResponse } from 'next/server';
import { islePilotClient } from '@/lib/islepilot/client';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onlineOnly = searchParams.get('online') === 'true';
    const search = searchParams.get('search') || '';

    // Fetch REAL players from IslePilot API directly
    const rawPlayers = await islePilotClient.getPlayers(onlineOnly, search);

    // Fetch all active server garage slots to cross-reference mutations for active live dinosaurs
    const allSlots = await islePilotClient.getAllServerGarage().catch(() => []);
    const garageMutationsMap = new Map<string, string[]>();
    for (const slot of allSlots) {
      if (slot.steamId && slot.species && Array.isArray(slot.mutations) && slot.mutations.length > 0) {
        const key = `${slot.steamId}_${slot.species.toLowerCase()}`;
        if (!garageMutationsMap.has(key)) {
          garageMutationsMap.set(
            key,
            slot.mutations.filter((m: string) => m && m !== 'None' && m !== '-')
          );
        }
      }
    }

    // Map pure real players directly from IslePilot
    const mappedPlayers = rawPlayers.map((p) => {
      // 1. Direct mutations from IslePilot player
      let cleanMutations = Array.isArray(p.mutations)
        ? p.mutations.filter((m: string) => m && m !== 'None' && m !== '-')
        : [];

      // 2. If empty, cross-reference mutations from their garage slot of the same species
      if (cleanMutations.length === 0 && p.steamId && p.species) {
        const garageMuts = garageMutationsMap.get(`${p.steamId}_${p.species.toLowerCase()}`);
        if (garageMuts && garageMuts.length > 0) {
          cleanMutations = garageMuts;
        }
      }

      return {
        ...p,
        mutations: cleanMutations,
      };
    });

    return NextResponse.json({ players: mappedPlayers, total: mappedPlayers.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
