const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function testMutationAction() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  // Test action: 'mutations' schema
  const payload = {
    action: 'mutations',
    steamId: '76561198354799757',
  };

  try {
    const res = await fetch(`${baseUrl}/commands`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    console.log('/commands mutations status:', res.status);
    const data = await res.json();
    console.log('/commands mutations response:', data);
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

testMutationAction();
