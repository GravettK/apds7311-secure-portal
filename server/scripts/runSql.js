// server/scripts/runSql.js
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run(fileArg) {
  const file = fileArg || './db/schema.sql';
  const sqlPath = path.resolve(__dirname, '..', file);
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    multipleStatements: true // allow whole schema in one go
  });

  try {
    await conn.query(sql);
    console.log(`✅ Ran SQL: ${file}`);
  } finally {
    await conn.end();
  }
}

run(process.argv[2]).catch(err => {
  console.error(' SQL run failed:', err.message);
  process.exit(1);
});
