const express = require('express');
const router = express.Router();

const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');
const { createPaymentSchema } = require('../validation/schemas');
const pool = require('../db/pool');

router.post('/', auth, validate(createPaymentSchema), async (req, res, next) => {
  try {
    const { accountTo, swift, currency, amountCents, purpose } = req.validated.body;
    const customerId = req.user?.sub;

    if (!customerId) return res.status(401).json({ error: 'Unauthorized' });

    const [result] = await pool.execute(
      `INSERT INTO payments
         (customer_id, beneficiary_id, amount_cents, currency, provider,
          swift_enc, acct_to_enc, purpose_text, status, created_at)
       VALUES (?, NULL, ?, ?, 'SWIFT', ?, ?, ?, 'PENDING', NOW())`,
      [customerId, amountCents, currency, Buffer.from(swift), Buffer.from(accountTo), purpose || '']
    );

    return res.status(201).json({ ok: true, paymentId: result.insertId });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
