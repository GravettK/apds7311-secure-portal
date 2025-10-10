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
