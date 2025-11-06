const bcrypt = require('bcrypt');
require('dotenv').config();
const { exec } = require('../src/db/db');

async function main() {
  const password_hash = await bcrypt.hash(process.env.SEED_EMP_PASSWORD || 'ChangeMe!123', 10);
  const email = process.env.SEED_EMP_EMAIL || 'employee1@bank.local';
  const fullName = 'Employee One';
  const saIdEnc = Buffer.from('seed', 'utf8');
  const acctEnc = Buffer.from('seed', 'utf8');
  const acctLast4 = '0000';

  await exec(
    `INSERT INTO users (email, password_hash, full_name, sa_id_enc, acct_num_enc, acct_last4, role_id, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, 3, 1)
     ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), full_name=VALUES(full_name), role_id=VALUES(role_id), is_verified=VALUES(is_verified)`,
    [email, password_hash, fullName, saIdEnc, acctEnc, acctLast4]
  );

  console.log('Seeded employee user:', email);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


