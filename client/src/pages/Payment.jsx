import React, { useState } from 'react';
import api from '../api/axios';

const rx = {
  account: /^\d{8,16}$/,
  swift: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/, // 8 or 11 (BIC)
  currency: /^(ZAR|USD|EUR|GBP)$/,
};

export default function Payment() {
  const [form, setForm] = useState({
    accountTo: '',
    swift: '',
    amount: '',
    currency: 'ZAR',
    purpose: '',
  });
  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    const next =
      name === 'amount' ? value.replace(/[^\d.]/g, '') : name === 'swift' ? value.toUpperCase() : value;
    setForm((p) => ({ ...p, [name]: next }));
    setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!rx.account.test(form.accountTo)) e.accountTo = 'Account number must be 8–16 digits.';
    if (!rx.swift.test(form.swift)) e.swift = 'SWIFT must be 8 or 11 chars (ISO 9362).';
    const amt = Number(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0) e.amount = 'Enter a positive amount.';
    if (!rx.currency.test(form.currency)) e.currency = 'Pick a valid currency.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!validate()) return;

    const amountCents = Math.round(Number(form.amount) * 100);

    setBusy(true);
    try {
      const { data } = await api.post('/payments', {
        accountTo: form.accountTo.trim(),
        swift: form.swift.trim(),
        currency: form.currency,
        amountCents,
        purpose: form.purpose.trim(),
      });
      setMsg(`Payment created. ID: ${data.paymentId}`);
      // setForm({ accountTo: '', swift: '', amount: '', currency: 'ZAR', purpose: '' });
    } catch (err) {
      const apiErr = err?.response?.data?.error || err?.response?.data?.message;
      setMsg(`${apiErr || 'Payment failed'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto' }}>
      <h3>New Payment</h3>
      <form onSubmit={onSubmit} noValidate>
        <label htmlFor="accountTo">Destination account</label>
        <input
          id="accountTo"
          name="accountTo"
          value={form.accountTo}
          onChange={onChange}
          inputMode="numeric"
          autoComplete="off"
          aria-invalid={!!errors.accountTo}
        />
        {errors.accountTo && <div className="error">{errors.accountTo}</div>}

        <label htmlFor="swift" style={{ marginTop: 10 }}>SWIFT / BIC</label>
        <input
          id="swift"
          name="swift"
          value={form.swift}
          onChange={onChange}
          autoComplete="off"
          aria-invalid={!!errors.swift}
        />
        {errors.swift && <div className="error">{errors.swift}</div>}

        <label htmlFor="amount" style={{ marginTop: 10 }}>Amount</label>
        <input
          id="amount"
          name="amount"
          value={form.amount}
          onChange={onChange}
          inputMode="decimal"
          placeholder="e.g. 100.00"
          autoComplete="off"
          aria-invalid={!!errors.amount}
        />
        {errors.amount && <div className="error">{errors.amount}</div>}

        <label htmlFor="currency" style={{ marginTop: 10 }}>Currency</label>
        <select id="currency" name="currency" value={form.currency} onChange={onChange} aria-invalid={!!errors.currency}>
          <option value="ZAR">ZAR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        {errors.currency && <div className="error">{errors.currency}</div>}

        <label htmlFor="purpose" style={{ marginTop: 10 }}>Purpose (optional)</label>
        <input
          id="purpose"
          name="purpose"
          value={form.purpose}
          onChange={onChange}
          maxLength={255}
          autoComplete="off"
        />

        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={busy}>{busy ? 'Processing…' : 'Pay'}</button>
        </div>
      </form>

      {msg && <div style={{ marginTop: 12 }} aria-live="polite">{msg}</div>}
    </div>
  );
}
