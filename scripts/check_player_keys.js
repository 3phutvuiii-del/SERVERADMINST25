const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function checkPlayerKeys() {
  const headers = { 'Authorization': `Bearer ${apiKey}` };
  const res = await fetch(`${baseUrl}/players/76561198354799757`, { headers });
  const data = await res.json();
  console.log('All keys on player detail:', Object.keys(data));
  console.log('Player raw mutations:', data.mutations, data.Mutations);
  console.log('Dino / Lineage fields:', data.dino, data.lineage, data.genes, data.traits, data.slots);
}

checkPlayerKeys();
