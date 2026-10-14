const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function inspectAllPlayerGarageMutations() {
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const res = await fetch(`${baseUrl}/players`, { headers });
  const data = await res.json();
  const players = data.players || data;

  const onlinePlayers = (players || []).filter(p => p.online);
  console.log(`Found ${onlinePlayers.length} online players.`);

  for (const p of onlinePlayers.slice(0, 10)) {
    const gRes = await fetch(`${baseUrl}/players/${p.steamId}/garage`, { headers });
    if (gRes.ok) {
      const gData = await gRes.json();
      const dinosWithMuts = (gData.garage || []).filter(d => d.mutations && d.mutations.length > 0);
      if (dinosWithMuts.length > 0) {
        console.log(`\nOnline Player ${p.name} (${p.steamId}) has ${dinosWithMuts.length} garage dinos with mutations:`);
        dinosWithMuts.forEach(d => {
          console.log(`- ${d.species} (${d.growth * 100}%):`, d.mutations);
        });
      }
    }
  }
}

inspectAllPlayerGarageMutations();
