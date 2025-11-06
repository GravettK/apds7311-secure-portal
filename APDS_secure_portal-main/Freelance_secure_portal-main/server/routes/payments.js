const router = require('express').Router();
const auth = require('../middleware/auth');

const { validate } = require('../middleware/validate');
const { createPaymentSchema } = require('../validation/schemas');
const payments = require('../src/repositories/paymentRepo');

router.post('/', auth, validate(createPaymentSchema), async (req, res, next) => {
  try {
    const { amountCents, currency, swift, accountTo, purpose } = req.validated.body;
    const out = await payments.create({
      customer_id: req.user.sub,
      amount_cents: amountCents,
      currency,
      swift,
      account_to: accountTo,
      purpose
    });
    res.status(201).json({ ok: true, paymentId: out.payment_id });
  } catch (e) { next(e); }
});

router.get('/', auth, async (req, res, next) => {
  try {
    const rows = await payments.listByCustomer({ customer_id: req.user.sub, limit: 100 });
    res.json({ ok: true, payments: rows });
  } catch (e) { next(e); }
});

module.exports = router;
