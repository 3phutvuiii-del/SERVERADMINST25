const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function findMutationsEndpoints() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
  };

  const testUrls = [
    '/server',
    '/garage',
    '/mutations',
    '/players/76561198354799757/mutations',
    '/players/76561198354799757/dino',
    '/dinos',
    '/rcon/command',
  ];

  for (const u of testUrls) {
    try {
      const res = await fetch(`${baseUrl}${u}`, { headers });
      console.log(`Endpoint ${u} -> Status: ${res.status}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Response for ${u}:`, JSON.stringify(data).slice(0, 300));
      }
    } catch (e) {
      console.log(`Endpoint ${u} -> Error: ${e.message}`);
    }
  }
}

findMutationsEndpoints();
