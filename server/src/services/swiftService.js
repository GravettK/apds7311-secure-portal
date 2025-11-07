function generateMT103(payment, customer, employee) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const amount = (payment.amount_cents / 100).toFixed(2);

  return `{1:F01BANKBEBBXXXX}{2:O1030805}${date}
{3:{108:APDS${payment.payment_id}}}
{4:
:20:PAY${payment.payment_id}
:32A:${payment.currency}${amount}
:50K:/${customer.acct_last4}
${customer.full_name}
:59:/BE9876543210
Beneficiary Name
:70:${payment.purpose_text || 'Payment'}
:71A:OUR
-}`.replace(/\n/g, '');
}

module.exports = { generateMT103 };