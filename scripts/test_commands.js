const apiKey = "ipa_de2e67047a0ce3285c4003b659f6bafa2ddd6fe46c46fe23";
const baseUrl = "https://islepilot.eu/api/v1";

async function testCommands() {
  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    action: 'execute_command',
    command: 'custom players',
  };

  try {
    const res = await fetch(`${baseUrl}/commands`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    console.log('/commands response status:', res.status);
    const data = await res.json();
    console.log('/commands response data:', data);
  } catch (err) {
    console.error('Command error:', err.message);
  }
}

testCommands();
