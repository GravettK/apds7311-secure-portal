const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { verifyPaymentSchema, submitPaymentSchema } = require('../validation/schemas');
const payments = require('../src/repositories/paymentRepo');

router.post('/verify', auth, auth.requireRole('employee'),
  validate(verifyPaymentSchema), async (req, res, next) => {
    try {
      const ok = await payments.verify({
        payment_id: Number(req.validated.body.paymentId),
        employee_id: req.user.sub
      });
      if (!ok) return res.status(400).json({ error: 'Invalid state or id' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

router.post('/submit', auth, auth.requireRole('employee'),
  validate(submitPaymentSchema), async (req, res, next) => {
    try {
      const { paymentId, swiftRef } = req.validated.body;
      const ok = await payments.submit({
        payment_id: Number(paymentId),
        employee_id: req.user.sub,
        swift_ref: swiftRef
      });
      if (!ok) return res.status(400).json({ error: 'Invalid state or id' });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

router.get('/payments', auth, auth.requireRole('employee'), async (req, res, next) => {
  try {
    const status = (req.query.status || 'PENDING').toUpperCase();
    if (!['PENDING', 'VERIFIED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const rows = await payments.listByStatus({ status, limit: 200 });
    res.json({ ok: true, payments: rows });
  } catch (e) { next(e); }
});

module.exports = router;
