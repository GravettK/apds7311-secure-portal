const router = require('express').Router();

const payments = [];
const reAmount = /^\d+(\.\d{1,2})?$/;
const reCurrency = /^(ZAR|USD|EUR|GBP)$/;
const reSWIFT = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

router.post('/', (req, res) => {
  const { amount, currency, provider, swift } = req.body || {};
  if (!reAmount.test(String(amount)) || !reCurrency.test(currency) || !reSWIFT.test(swift)) {
    return res.status(400).json({ error: 'Invalid payment data' });
  }
  const record = {
    id: payments.length + 1,
    userId: req.user.id,
    amount: Number(amount),
    currency,
    provider: provider || 'BANK',
    swift,
    ts: new Date().toISOString()
  };
  payments.push(record);
  res.status(201).json({ ok: true, paymentId: record.id });
});

module.exports = router;
