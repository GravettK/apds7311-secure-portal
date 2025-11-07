const express = require('express');
const router = express.Router();

const db = require('../src/db/db');
const { generateMT103 } = require('../src/services/swiftService');
const { validate } = require('../src/middleware/validate');
const { transactionVerifySchema, transactionSubmitSchema } = require('../src/validation/schemas');

router.get('/pending', async (req, res) => {
  try {
    const rows = await db.query(`
      SELECT 
        p.payment_id, p.amount_cents, p.currency, p.purpose_text, p.status,
        u.user_id AS customer_id, u.full_name, u.acct_last4
      FROM payments p
      JOIN users u ON p.customer_id = u.user_id
      WHERE p.status = 'PENDING'
    `);

    const formatted = rows.map(r => ({
      id: `PAY${r.payment_id}`,
      customerId: `CUST${r.customer_id}`,
      customerName: r.full_name,
      amount: r.amount_cents / 100,
      currency: r.currency,
      purpose: r.purpose_text || '—',
      status: r.status
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

router.post('/:id/verify', async (req, res) => {
  const paymentId = String(req.params.id || '').replace(/^PAY/, '');
  const { verifiedBy } = req.body;
  if (!verifiedBy) return res.status(400).json({ error: 'verifiedBy required' });

  try {
    const verifyResult = await db.exec(
      `UPDATE payments 
       SET status = 'VERIFIED', verified_by = ?, verified_at = NOW()
       WHERE payment_id = ? AND status = 'PENDING'`,
      [verifiedBy, paymentId]
    );

    if (verifyResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found or not pending' });
    }

    const rows = await db.query(
      `SELECT p.*, u.full_name, u.acct_last4, e.full_name AS emp_name
       FROM payments p
       JOIN users u ON p.customer_id = u.user_id
       LEFT JOIN users e ON e.user_id = ?
       WHERE p.payment_id = ?`,
      [verifiedBy, paymentId]
    );

    const payment = rows[0];
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const swiftMessage = generateMT103(
      payment,
      { full_name: payment.full_name, acct_last4: payment.acct_last4 },
      { full_name: payment.emp_name || 'Employee' }
    );

    await db.exec(
      `UPDATE payments 
       SET status = 'SUBMITTED', swift_ref = ?, submit_by = ?, submit_at = NOW()
       WHERE payment_id = ?`,
      [swiftMessage, verifiedBy, paymentId]
    );

    res.json({ success: true, swiftMessage });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/verify', validate(transactionVerifySchema), async (req, res) => {
  try {
    res.json({ ok: true, message: 'Verification OK' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/submit-swift', validate(transactionSubmitSchema), async (req, res) => {
  try {
    const { accountNumber, swift, currency, amount, description } = req.validated.body;
    const pseudoPayment = {
      amount_cents: Math.round(Number(amount) * 100),
      currency,
      purpose_text: description || '',
    };
    const customer = { full_name: 'Customer', acct_last4: String(accountNumber).slice(-4) };
    const employee = { full_name: 'System' };
    const swiftMessage = generateMT103(pseudoPayment, customer, employee);
    res.status(201).json({ ok: true, message: 'Transaction submitted successfully', swiftMessage });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
