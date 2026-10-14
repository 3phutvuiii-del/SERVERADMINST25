const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('Testing connection to 103.57.223.36:3306...');
  try {
    const connection = await mysql.createConnection({
      host: '103.57.223.36',
      port: 3306,
      user: 'ikolhwnwhosting_islest25',
      password: 'AAhu1u2o381o291292b@',
      database: 'ikolhwnwhosting_DBSt25',
      connectTimeout: 10000,
    });
    console.log('Connection successful!');
    const [rows] = await connection.query('SELECT VERSION() as version, DATABASE() as db');
    console.log('Connected DB Info:', rows);
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
