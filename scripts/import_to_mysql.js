const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function splitSqlStatements(sql) {
  // Remove block comments and single-line comments
  const cleaned = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .trim();

  // Split on semicolons that are not inside quotes
  const statements = [];
  let current = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const prevChar = i > 0 ? cleaned[i - 1] : '';

    if (char === "'" && prevChar !== '\\' && !inDoubleQuote && !inBacktick) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && prevChar !== '\\' && !inSingleQuote && !inBacktick) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === '`' && !inSingleQuote && !inDoubleQuote) {
      inBacktick = !inBacktick;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

async function runImport() {
  console.log('Connecting to MariaDB on 103.57.223.36...');
  const conn = await mysql.createConnection({
    host: '103.57.223.36',
    port: 3306,
    user: 'ikolhwnwhosting_islest25',
    password: 'AAhu1u2o381o291292b@',
    database: 'ikolhwnwhosting_DBSt25',
  });

  try {
    console.log('--- 1. Executing Schema ---');
    const schemaSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.mysql.sql'), 'utf-8');
    const schemaStmts = splitSqlStatements(schemaSql);
    console.log(`Found ${schemaStmts.length} schema statements.`);

    for (let i = 0; i < schemaStmts.length; i++) {
      const stmt = schemaStmts[i];
      try {
        await conn.query(stmt);
      } catch (err) {
        console.error(`Error on schema stmt #${i + 1}:`, err.message);
        console.error('Snippet:', stmt.slice(0, 100));
        throw err;
      }
    }
    console.log('All schema statements executed successfully!');

    console.log('--- 2. Executing Seed Data ---');
    const seedSql = fs.readFileSync(path.join(__dirname, '..', 'database', 'seed_data.mysql.sql'), 'utf-8');
    const seedStmts = splitSqlStatements(seedSql);
    console.log(`Found ${seedStmts.length} seed statements.`);

    for (let i = 0; i < seedStmts.length; i++) {
      const stmt = seedStmts[i];
      try {
        await conn.query(stmt);
      } catch (err) {
        console.error(`Error on seed stmt #${i + 1}:`, err.message);
        console.error('Snippet:', stmt.slice(0, 100));
        throw err;
      }
    }
    console.log('All seed data inserted successfully!');

    const [tables] = await conn.query('SHOW TABLES');
    console.log('Tables created:', tables.map(r => Object.values(r)[0]));
  } finally {
    await conn.end();
  }
}

runImport().catch(err => {
  console.error('Import process failed:', err);
  process.exit(1);
});
