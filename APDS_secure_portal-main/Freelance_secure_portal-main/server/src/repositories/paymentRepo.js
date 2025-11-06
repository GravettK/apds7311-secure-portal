const { exec, query } = require('../db/db');
const { encrypt } = require('../utils/crypto');

async function create({ customer_id, amount_cents, currency, swift, account_to, purpose }) {
  const swift_enc = encrypt(swift);
  const acct_to_enc = encrypt(account_to);

  const res = await exec(
    `INSERT INTO payments
      (customer_id, amount_cents, currency, provider, swift_enc, acct_to_enc, purpose_text, status)
     VALUES (?, ?, ?, 'SWIFT', ?, ?, ?, 'PENDING')`,
    [customer_id, amount_cents, currency, swift_enc, acct_to_enc, purpose || null]
  );
  return { payment_id: res.insertId };
}

async function verify({ payment_id, employee_id }) {
  const res = await exec(
    `UPDATE payments
        SET status='VERIFIED', verified_by=?, verified_at=NOW()
      WHERE payment_id=? AND status='PENDING'`,
    [employee_id, payment_id]
  );
  return res.affectedRows === 1;
}

async function submit({ payment_id, employee_id, swift_ref }) {
  const res = await exec(
    `UPDATE payments
        SET status='SUBMITTED', submit_by=?, submit_at=NOW(), swift_ref=?
      WHERE payment_id=? AND status='VERIFIED'`,
    [employee_id, swift_ref, payment_id]
  );
  return res.affectedRows === 1;
}

module.exports = { create, verify, submit };
 
async function listByCustomer({ customer_id, limit = 50 }) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
  const rows = await query(
    `SELECT payment_id, amount_cents, currency, provider, status, created_at, verified_at, submit_at, swift_ref
       FROM payments
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit}`,
    [customer_id]
  );
  return rows;
}

async function listByStatus({ status, limit = 100 }) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const rows = await query(
    `SELECT payment_id, customer_id, amount_cents, currency, provider, status, created_at, verified_by, verified_at
       FROM payments
      WHERE status = ?
      ORDER BY created_at ASC
      LIMIT ${safeLimit}`,
    [status]
  );
  return rows;
}

module.exports = { create, verify, submit, listByCustomer, listByStatus };
