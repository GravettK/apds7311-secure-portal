const { exec, query } = require('../db/db');
const { encrypt } = require('../utils/crypto');

function asInt(n, def = 0) {
  const v = parseInt(String(n), 10);
  return Number.isFinite(v) ? v : def;
}

function clamp(n, lo, hi) {
  const v = asInt(n, lo);
  return Math.max(lo, Math.min(hi, v));
}

async function create({ customer_id, amount_cents, currency, swift, account_to, purpose }) {
  const swift_enc = encrypt(swift);
  const acct_to_enc = encrypt(account_to);
  const curr = String(currency || 'ZAR').toUpperCase();

  const res = await exec(
    `INSERT INTO payments
       (customer_id, amount_cents, currency, provider, swift_enc, acct_to_enc, purpose_text, status)
     VALUES (?, ?, ?, 'SWIFT', ?, ?, ?, 'PENDING')`,
    [customer_id, amount_cents, curr, swift_enc, acct_to_enc, purpose || null]
  );

  await exec(
    `INSERT INTO audit_logs (actor_user, event_type, entity, entity_id, meta_json)
     VALUES (?, 'PAY_CREATE', 'payment', ?, JSON_OBJECT('currency', ?, 'amount_cents', ?))`,
    [customer_id, res.insertId, curr, amount_cents]
  );

  return { payment_id: res.insertId };
}

async function verify({ payment_id, employee_id }) {
  const r = await exec(
    `UPDATE payments
        SET status = 'VERIFIED', verified_by = ?, verified_at = NOW()
      WHERE payment_id = ? AND status = 'PENDING'`,
    [employee_id, payment_id]
  );

  const ok = r.affectedRows === 1;

  if (ok) {
    await exec(
      `INSERT INTO audit_logs (actor_user, event_type, entity, entity_id)
       VALUES (?, 'PAY_VERIFY', 'payment', ?)`,
      [employee_id, payment_id]
    );
  }

  return ok;
}

async function submit({ payment_id, employee_id, swift_ref }) {
  const r = await exec(
    `UPDATE payments
        SET status = 'SUBMITTED', submit_by = ?, submit_at = NOW(), swift_ref = ?
      WHERE payment_id = ? AND status = 'VERIFIED'`,
    [employee_id, swift_ref, payment_id]
  );

  const ok = r.affectedRows === 1;

  if (ok) {
    await exec(
      `INSERT INTO audit_logs (actor_user, event_type, entity, entity_id, meta_json)
       VALUES (?, 'PAY_SUBMIT', 'payment', ?, JSON_OBJECT('swift_ref', ?))`,
      [employee_id, payment_id, swift_ref || null]
    );
  }

  return ok;
}

async function listByCustomer({ customer_id, limit = 50, offset = 0 }) {
  const safeLimit = clamp(limit, 1, 500);
  const safeOffset = clamp(offset, 0, 10_000);

  const rows = await query(
    `SELECT payment_id, amount_cents, currency, provider, status,
            created_at, verified_at, submit_at, swift_ref, purpose_text
       FROM payments
      WHERE customer_id = ?
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [customer_id]
  );
  return rows;
}

async function listByStatus({ status, limit = 100, offset = 0 }) {
  const safeLimit = clamp(limit, 1, 500);
  const safeOffset = clamp(offset, 0, 10_000);
  const s = String(status || 'PENDING').toUpperCase();

  const rows = await query(
    `SELECT payment_id, customer_id, amount_cents, currency, provider, status,
            created_at, verified_by, verified_at, submit_by, submit_at, swift_ref
       FROM payments
      WHERE status = ?
      ORDER BY created_at ASC
      LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [s]
  );
  return rows;
}

module.exports = {
  create,
  verify,
  submit,
  listByCustomer,
  listByStatus,
};
