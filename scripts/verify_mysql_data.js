const mysql = require('mysql2/promise');

async function checkImport() {
  const connection = await mysql.createConnection({
    host: '103.57.223.36',
    port: 3306,
    user: 'ikolhwnwhosting_islest25',
    password: 'AAhu1u2o381o291292b@',
    database: 'ikolhwnwhosting_DBSt25',
  });

  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));

    const counts = {};
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [[countResult]] = await connection.query(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      counts[tableName] = countResult.cnt;
    }
    console.log('Row counts per table:', counts);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await connection.end();
  }
}

checkImport();
