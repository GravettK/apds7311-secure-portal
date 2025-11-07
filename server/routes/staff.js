const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { verifyPaymentSchema, submitPaymentSchema } = require('../validation/schemas');
const payments = require('../src/repositories/paymentRepo');
const db = require('../src/db/db');

function parseId(raw) {
  const n = parseInt(String(raw), 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

router.post(
  '/verify',
  auth,
  auth.requireRole('employee'),
  validate(verifyPaymentSchema),
  async (req, res, next) => {
    try {
      const pid = parseId(req.validated.body.paymentId);
      if (!pid) return res.status(400).json({ error: 'Invalid paymentId' });

      const ok = await payments.verify({
        payment_id: pid,
        employee_id: req.user.sub,
      });

      if (!ok) return res.status(404).json({ error: 'Payment not found or not pending' });
      res.json({ ok: true, message: 'Payment verified' });
    } catch (e) { next(e); }
  }
);

router.post(
  '/submit',
  auth,
  auth.requireRole('employee'),
  validate(submitPaymentSchema),
  async (req, res, next) => {
    try {
      const pid = parseId(req.validated.body.paymentId);
      if (!pid) return res.status(400).json({ error: 'Invalid paymentId' });

      const ok = await payments.submit({
        payment_id: pid,
        employee_id: req.user.sub,
        swift_ref: req.validated.body.swiftRef,
      });

      if (!ok) return res.status(409).json({ error: 'Cannot submit from current status or not found' });
      res.json({ ok: true, message: 'Payment submitted' });
    } catch (e) { next(e); }
  }
);

router.get(
  '/payments',
  auth,
  auth.requireRole('employee'),
  async (req, res, next) => {
    try {
      const status = String(req.query.status || 'PENDING').toUpperCase();
      if (!['PENDING', 'VERIFIED', 'SUBMITTED', 'PAID', 'FAILED', 'CANCELLED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      const limit = Math.max(1, Math.min(200, parseInt(req.query.limit || '50', 10)));
      const offset = Math.max(0, parseInt(req.query.offset || '0', 10));

      const rows = await payments.listByStatus({ status, limit, offset });
      res.json({ ok: true, payments: rows, paging: { limit, offset, status } });
    } catch (e) { next(e); }
  }
);

module.exports = router;
// fetch single payment detail for transaction view
router.get('/payments/:id', auth, auth.requireRole('employee'), async (req, res, next) => {
  try {
    const pid = parseInt(String(req.params.id), 10);
    if (!Number.isFinite(pid) || pid <= 0) return res.status(400).json({ error: 'Invalid id' });
    // limited columns for detail view
    const rows = await db.query(`SELECT payment_id, customer_id, amount_cents, currency, status, swift_ref, verified_by, verified_at, submit_by, submit_at FROM payments WHERE payment_id = ?`, [pid]);
    const p = rows[0];
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, payment: p });
  } catch (e) { next(e); }
});
