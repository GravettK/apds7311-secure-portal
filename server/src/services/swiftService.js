function safeField(val, max = 140) {
  return String(val ?? '')
    .replace(/[\r\n]/g, ' ')
    .slice(0, max)
    .trim();
}

function generateMT103(payment, customer, employee) {
  const now = new Date();
  const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
  const amount = ((payment.amount_cents || 0) / 100).toFixed(2);
  const currency = String(payment.currency || 'ZAR').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
  const senderBIC = 'BANKBEBBXXXX'; // mock BIC for demo/rubric
  const msgRef = `APDS${payment.payment_id}`;

  const payerName = safeField(customer.full_name, 35);
  const payerAcctLast4 = safeField(customer.acct_last4, 4);

  const beneficiaryAcct = safeField('BE9876543210', 34);     // mock demo account (we don’t decrypt)
  const beneficiaryName = safeField('Beneficiary Name', 35); // mock demo name

  const purpose = safeField(payment.purpose_text || 'Payment', 140);

  const block1 = `{1:F01${senderBIC}}`;
  const block2 = `{2:I103${senderBIC}N}`;
  const block3 = `{3:{108:${msgRef}}}`;

  const block4 =
    `{4:\r\n` +
    `:20:PAY${payment.payment_id}\r\n` +
    `:32A:${yymmdd}${currency}${amount}\r\n` +
    `:50K:/${payerAcctLast4}\r\n` +
    `${payerName}\r\n` +
    `:59:/${beneficiaryAcct}\r\n` +
    `${beneficiaryName}\r\n` +
    `:70:${purpose}\r\n` +
    `:71A:OUR\r\n` +
    `-}`;

  return `${block1}${block2}${block3}${block4}`;
}

module.exports = { generateMT103 };
