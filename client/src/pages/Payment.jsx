import React, { useState } from 'react';
import api from '../api/axios'; // <-- or: import axios as api from 'axios'

const patterns = {
  accountNumber: /^\d{8,16}$/,
  swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/,
  currency: /^(ZAR|USD|EUR|GBP)$/,
};

export default function Payment() {
  const [form, setForm] = useState({
    accountNumber: '',
    swift: '',
    amount: '',
    currency: 'ZAR',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    // small nicety: keep amount numeric-ish while typing
    const next = name === 'amount'
      ? value.replace(/[^\d.]/g, '')
      : value;

    setForm(prev => ({ ...prev, [name]: next }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!patterns.accountNumber.test(form.accountNumber)) {
      errs.accountNumber = 'Account number must be 8–16 digits.';
    }
    if (!patterns.swift.test(form.swift)) {
      errs.swift = 'SWIFT must be 8 or 11 alphanumeric characters.';
    }
    const amt = Number(form.amount);
    if (!form.amount || Number.isNaN(amt) || amt <= 0) {
      errs.amount = 'Enter a positive amount.';
    }
    if (!patterns.currency.test(form.currency)) {
      errs.currency = 'Currency must be ZAR, USD, EUR or GBP.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Adjust the path if your route differs, e.g. '/api/payments'
      const { data } = await api.post('/api/payment', {
        accountNumber: form.accountNumber.trim(),
        swift: form.swift.trim().toUpperCase(),
        amount: Number(form.amount),
        currency: form.currency,
      });

      setMessage(`✅ Payment successful${data?.message ? `: ${data.message}` : ''}`);
      // optional: reset fields
      // setForm({ accountNumber: '', swift: '', amount: '', currency: 'ZAR' });
    } catch (err) {
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      setMessage(`❌ Payment failed: ${apiMsg || err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h3>Payment</h3>

      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="accountNumber">Account number</label>
        <input
          id="accountNumber"
          name="accountNumber"
          value={form.accountNumber}
          onChange={handleChange}
          inputMode="numeric"
          pattern="\d{8,16}"
          autoComplete="off"
          aria-invalid={!!errors.accountNumber}
          aria-describedby={errors.accountNumber ? 'err-accountNumber' : undefined}
        />
        {errors.accountNumber && (
          <div id="err-accountNumber" className="error" role="alert">
            {errors.accountNumber}
          </div>
        )}

        <label htmlFor="swift" style={{ marginTop: 10 }}>SWIFT code</label>
        <input
          id="swift"
          name="swift"
          value={form.swift}
          onChange={handleChange}
          autoComplete="off"
          aria-invalid={!!errors.swift}
          aria-describedby={errors.swift ? 'err-swift' : undefined}
        />
        {errors.swift && (
          <div id="err-swift" className="error" role="alert">
            {errors.swift}
          </div>
        )}

        <label htmlFor="amount" style={{ marginTop: 10 }}>Amount</label>
        <input
          id="amount"
          name="amount"
          value={form.amount}
          onChange={handleChange}
          inputMode="decimal"
          placeholder="e.g. 100.00"
          autoComplete="off"
          aria-invalid={!!errors.amount}
          aria-describedby={errors.amount ? 'err-amount' : undefined}
        />
        {errors.amount && (
          <div id="err-amount" className="error" role="alert">
            {errors.amount}
          </div>
        )}

        <label htmlFor="currency" style={{ marginTop: 10 }}>Currency</label>
        <select
          id="currency"
          name="currency"
          value={form.currency}
          onChange={handleChange}
          aria-invalid={!!errors.currency}
          aria-describedby={errors.currency ? 'err-currency' : undefined}
        >
          <option value="ZAR">ZAR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        {errors.currency && (
          <div id="err-currency" className="error" role="alert">
            {errors.currency}
          </div>
        )}

        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={submitting}>
            {submitting ? 'Processing…' : 'Pay'}
          </button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 12 }} aria-live="polite">
          {message}
        </div>
      )}
    </div>
  );
}
