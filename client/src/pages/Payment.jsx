import React, { useState } from 'react';
import api from '../api/axios';

const patterns = {
  accountNumber: /^\d{8,16}$/, // 8-16 digits
  swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, // 8 or 11 alphanumeric
  currency: /^(ZAR|USD|EUR|GBP)$/,
};

export default function Payment() {
  const [form, setForm] = useState({
    accountNumber: '',
    swift: '',
    amount: '',
    currency: 'ZAR',
    purpose: '',
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    const next = name === 'amount' ? value.replace(/[^\d.]/g, '') : name === 'swift' ? value.toUpperCase() : value;
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
      const amountCents = Math.round(Number(form.amount) * 100);
      const payload = {
        accountTo: form.accountNumber.trim(),
        swift: form.swift.trim().toUpperCase(),
        currency: form.currency,
        amountCents,
        purpose: (form.purpose || '').trim(),
      };

      const { data } = await api.post('/api/payments', payload);
      setMessage(data?.message || `Payment created. ID: ${data?.paymentId || 'unknown'}`);
      // optional: reset form
      // setForm({ accountNumber: '', swift: '', amount: '', currency: 'ZAR', purpose: '' });
    } catch (err) {
      const apiMsg = err?.error || err?.message || (err && JSON.stringify(err));
      setMessage(apiMsg || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto' }}>
      <h3>New Payment</h3>
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
          <div id="err-accountNumber" className="error" role="alert">{errors.accountNumber}</div>
        )}

        <label htmlFor="swift" style={{ marginTop: 10 }}>SWIFT / BIC</label>
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
          <div id="err-swift" className="error" role="alert">{errors.swift}</div>
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
          <div id="err-amount" className="error" role="alert">{errors.amount}</div>
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
          <div id="err-currency" className="error" role="alert">{errors.currency}</div>
        )}

        <label htmlFor="purpose" style={{ marginTop: 10 }}>Purpose (optional)</label>
        <input
          id="purpose"
          name="purpose"
          value={form.purpose}
          onChange={handleChange}
          maxLength={255}
          autoComplete="off"
        />

        <div style={{ marginTop: 14 }}>
          <button type="submit" disabled={submitting}>{submitting ? 'Processing…' : 'Pay'}</button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 12 }} aria-live="polite">{message}</div>
      )}
    </div>
  );
}