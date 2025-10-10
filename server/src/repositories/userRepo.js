const { exec, query } = require('../db/db');
const { encrypt } = require('../utils/crypto');

async function findByEmail(email) {
  const rows = await query(
    `SELECT u.*, r.role_name
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
      WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function create({ email, password_hash, full_name, sa_id, account_number }) {
  const sa_id_enc = encrypt(sa_id);
  const acct_num_enc = encrypt(account_number);
  const acct_last4 = String(account_number).slice(-4);

  const res = await exec(
    `INSERT INTO users
      (email, password_hash, full_name, sa_id_enc, acct_num_enc, acct_last4, role_id, is_verified)
     VALUES (?, ?, ?, ?, ?, ?, 4, 0)`,
    [email, password_hash, full_name, sa_id_enc, acct_num_enc, acct_last4]
  );

  return { user_id: res.insertId };
}

module.exports = { findByEmail, create };
