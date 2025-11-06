import React, { useState } from 'react';
import api from '../api/axios';
import DOMPurify from 'dompurify';
import { Helmet } from 'react-helmet';

const patterns = {
  accountNumber: /^\d{8,16}$/,
  swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/,
  currency: /^(ZAR|USD|EUR|GBP)$/,
  amount: /^\d+(\.\d{1,2})?$/,
};

export default function Transaction() {
  const [form, setForm] = useState({
    accountNumber: '',
    swift: '',
    amount: '',
    currency: 'ZAR',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setMessage('');
  }

  function validate() {
    const errs = {};
    if (!patterns.accountNumber.test(form.accountNumber)) errs.accountNumber = 'Account number must be 8–16 digits.';
    if (!patterns.swift.test(form.swift)) errs.swift = 'SWIFT must be 8 or 11 alphanumeric characters.';
    if (!patterns.amount.test(form.amount) || Number(form.amount) <= 0) errs.amount = 'Enter a positive amount (max 2 decimals).';
    if (!patterns.currency.test(form.currency)) errs.currency = 'Currency must be ZAR, USD, EUR or GBP.';
   
    const cleanDesc = DOMPurify.sanitize(form.description || '');
    if (cleanDesc.length > 200) errs.description = 'Description must be 200 characters or fewer.';
    setErrors(errs);
    return { ok: Object.keys(errs).length === 0, cleanDesc };
  }

  async function handleVerify(e) {
    e?.preventDefault();
    setMessage('');
    const { ok } = validate();
    if (!ok) return;
    setVerifying(true);
    try {
      const payload = {
        accountNumber: form.accountNumber,
        swift: form.swift,
        currency: form.currency,
      };
     
      const res = await api.post('/transactions/verify', payload);
      setMessage(res?.data?.message || 'Verification OK');
    } catch (err) {
      setMessage('Verification failed: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    const { ok, cleanDesc } = validate();
    if (!ok) return;
    setLoading(true);

   
    const safePayload = {
      accountNumber: form.accountNumber,
      swift: form.swift,
      amount: Number(form.amount),
      currency: form.currency,
      description: DOMPurify.sanitize(cleanDesc),
    };

    try {
      
      const res = await api.post('/transactions/submit-swift', safePayload);
      setMessage(res?.data?.message || 'Transaction submitted successfully.');
      // Optionally clear form:
      setForm({ accountNumber: '', swift: '', amount: '', currency: 'ZAR', description: '' });
    } catch (err) {
      setMessage('Submission failed: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '20px auto', padding: 16 }}>
      <Helmet>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self';" />
        <title>Transactions — Verify & Submit</title>
      </Helmet>

      <h2>Transaction — Verify & Submit to SWIFT</h2>

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label>Account Number</label>
          <input name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="8-16 digits" />
          {errors.accountNumber && <div className="error">{errors.accountNumber}</div>}
        </div>

        <div className="form-row">
          <label>SWIFT Code</label>
          <input name="swift" value={form.swift} onChange={handleChange} placeholder="8 or 11 chars" />
          {errors.swift && <div className="error">{errors.swift}</div>}
        </div>

        <div className="form-row">
          <label>Amount</label>
          <input name="amount" value={form.amount} onChange={handleChange} placeholder="e.g. 100.00" />
          {errors.amount && <div className="error">{errors.amount}</div>}
        </div>

        <div className="form-row">
          <label>Currency</label>
          <select name="currency" value={form.currency} onChange={handleChange}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
          {errors.currency && <div className="error">{errors.currency}</div>}
        </div>

        <div className="form-row">
          <label>Description</label>
          <input name="description" value={form.description} onChange={handleChange} placeholder="Optional (max 200 chars)" />
          {errors.description && <div className="error">{errors.description}</div>}
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="button" onClick={handleVerify} disabled={verifying || loading}>
            {verifying ? 'Verifying...' : 'Verify'}
          </button>

          <button type="submit" disabled={loading || verifying}>
            {loading ? 'Submitting...' : 'Submit to SWIFT'}
          </button>
        </div>
      </form>

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}