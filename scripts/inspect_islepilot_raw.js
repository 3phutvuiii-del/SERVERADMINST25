const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function inspectIslePilotData() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
  };

  try {
    console.log('1. Checking /players...');
    const resPlayers = await fetch(`${baseUrl}/players`, { headers });
    const playersData = await resPlayers.json();
    const players = playersData.players || playersData;
    console.log(`Total players returned: ${players?.length}`);

    // Find any online player or specific player mentioned (76561198354799757 or 76561199292380914)
    const targetSteamIds = ['76561198354799757', '76561199292380914'];
    for (const sid of targetSteamIds) {
      console.log(`\n--- Inspecting Player ${sid} ---`);
      const resDetail = await fetch(`${baseUrl}/players/${sid}`, { headers });
      if (resDetail.ok) {
        const detail = await resDetail.json();
        console.log(`Detail for ${sid}:`, JSON.stringify(detail, null, 2).slice(0, 500));
      } else {
        console.log(`Detail status for ${sid}: ${resDetail.status}`);
      }

      console.log(`Checking /players/${sid}/garage...`);
      const resGarage = await fetch(`${baseUrl}/players/${sid}/garage`, { headers });
      if (resGarage.ok) {
        const garage = await resGarage.json();
        console.log(`Garage for ${sid}:`, JSON.stringify(garage, null, 2));
      } else {
        console.log(`Garage status for ${sid}: ${resGarage.status}`);
      }
    }

    // Inspect first online player in the list
    if (Array.isArray(players)) {
      const onlinePlayer = players.find(p => p.online);
      if (onlinePlayer) {
        console.log(`\n--- Inspecting Online Player ${onlinePlayer.steamId} (${onlinePlayer.name}) ---`);
        console.log('Raw player object:', JSON.stringify(onlinePlayer, null, 2));
        const resDetail = await fetch(`${baseUrl}/players/${onlinePlayer.steamId}`, { headers });
        if (resDetail.ok) {
          const detail = await resDetail.json();
          console.log('Online player full detail:', JSON.stringify(detail, null, 2));
        }
      }
    }
  } catch (err) {
    console.error('Inspect error:', err);
  }
}

inspectIslePilotData();
