const mysql = require('mysql2/promise');

async function checkRealData() {
  const conn = await mysql.createConnection({
    host: '103.57.223.36',
    port: 3306,
    user: 'ikolhwnwhosting_islest25',
    password: 'AAhu1u2o381o291292b@',
    database: 'ikolhwnwhosting_DBSt25',
  });

  try {
    const [garageRows] = await conn.query('SELECT `slot_id`, `steam_id`, `species`, `mutations`, `lineage`, `elder` FROM `garage_slot_mutations` LIMIT 5');
    console.log('Sample garage_slot_mutations in MySQL:');
    console.log(JSON.stringify(garageRows, null, 2));

    const [playerRows] = await conn.query('SELECT `steam_id`, `species`, `active_mutations`, `lineage_mutations`, `elder` FROM `player_live_profiles` LIMIT 5');
    console.log('\nSample player_live_profiles in MySQL:');
    console.log(JSON.stringify(playerRows, null, 2));
  } finally {
    await conn.end();
  }
}

checkRealData();
