import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import DOMPurify from 'dompurify';

const rx = {
  account: /^\d{8,16}$/,
  bic: /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/,    // ISO 9362 (8 or 11)
  currency: /^(ZAR|USD|EUR|GBP)$/,
  amount: /^\d+(\.\d{1,2})?$/,                           // max 2 decimals
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
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    let next = value;

    if (name === 'swift') next = value.toUpperCase();
    if (name === 'amount') next = value.replace(/[^\d.]/g, '');

    setForm((prev) => ({ ...prev, [name]: next }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setMessage('');
  }

  function validate() {
    const e = {};
    if (!rx.account.test(form.accountNumber)) e.accountNumber = 'Account number must be 8–16 digits.';
    if (!rx.bic.test(form.swift)) e.swift = 'SWIFT/BIC must be 8 or 11 characters.';
    if (!rx.amount.test(form.amount) || Number(form.amount) <= 0) e.amount = 'Enter a positive amount (up to 2 decimals).';
    if (!rx.currency.test(form.currency)) e.currency = 'Currency must be ZAR, USD, EUR or GBP.';

    const cleanDesc = DOMPurify.sanitize(form.description || '').slice(0, 200);
    if ((form.description || '').length > 200) e.description = 'Description must be 200 characters or fewer.';

    setErrors(e);
    return { ok: Object.keys(e).length === 0, cleanDesc };
  }

  async function handleVerify(e) {
    e?.preventDefault();
    if (verifying || loading) return;
    setMessage('');

    const { ok } = validate();
    if (!ok) return;

    setVerifying(true);
    try {
      const payload = {
        accountNumber: form.accountNumber.trim(),
        swift: form.swift.trim(),
        currency: form.currency,
      };
      const res = await api.post('/transactions/verify', payload);
      setMessage(res?.data?.message || 'Verification OK.');
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (status === 401) {
        setMessage('Session expired. Redirecting to login…');
        setTimeout(() => navigate('/login'), 800);
      } else {
        setMessage(`Verification failed: ${apiMsg || err.message}`);
      }
    } finally {
      setVerifying(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading || verifying) return;
    setMessage('');

    const { ok, cleanDesc } = validate();
    if (!ok) return;

    const amountCents = Math.round(Number(form.amount) * 100);
    const safePayload = {
      accountNumber: form.accountNumber.trim(),
      swift: form.swift.trim(),
      currency: form.currency,
      amountCents,
      description: cleanDesc,
      // include amount for backward-compat if backend expects number:
      amount: Number(form.amount),
    };

    setLoading(true);
    try {
      const res = await api.post('/transactions/submit-swift', safePayload);
      setMessage(res?.data?.message || 'Transaction submitted successfully.');
      setForm({ accountNumber: '', swift: '', amount: '', currency: 'ZAR', description: '' });
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.error || err?.response?.data?.message;
      if (status === 401) {
        setMessage('Session expired. Redirecting to login…');
        setTimeout(() => navigate('/login'), 800);
      } else {
        setMessage(`Submission failed: ${apiMsg || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const isError = message.toLowerCase().includes('fail') || message.toLowerCase().includes('error');

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <meta httpEquiv="Content-Security-Policy" content="default-src 'self';" />
        <title>SWIFT Transaction</title>
      </Helmet>

      <div className="max-w-2xl mx-auto bg-white/30 backdrop-blur-sm shadow-lg rounded-lg p-8">
        <h2 className="text-2xl font-bold mb-6 text-center">SWIFT Transaction</h2>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Account Number</label>
            <input
              type="text"
              name="accountNumber"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.accountNumber}
              onChange={handleChange}
              placeholder="8-16 digits"
              inputMode="numeric"
              aria-invalid={!!errors.accountNumber}
              aria-describedby={errors.accountNumber ? 'err-account' : undefined}
            />
            {errors.accountNumber && <div id="err-account" className="text-red-500 text-sm mt-1">{errors.accountNumber}</div>}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">SWIFT Code</label>
            <input
              type="text"
              name="swift"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.swift}
              onChange={handleChange}
              placeholder="8 or 11 chars"
              aria-invalid={!!errors.swift}
              aria-describedby={errors.swift ? 'err-swift' : undefined}
            />
            {errors.swift && <div id="err-swift" className="text-red-500 text-sm mt-1">{errors.swift}</div>}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="text"
              name="amount"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.amount}
              onChange={handleChange}
              placeholder="e.g. 100.00"
              inputMode="decimal"
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'err-amount' : undefined}
            />
            {errors.amount && <div id="err-amount" className="text-red-500 text-sm mt-1">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              name="currency"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {errors.currency && <div id="err-currency" className="text-red-500 text-sm mt-1">{errors.currency}</div>}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              name="description"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional (max 200 chars)"
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'err-desc' : undefined}
            />
            {errors.description && <div id="err-desc" className="text-red-500 text-sm mt-1">{errors.description}</div>}
          </div>

          <div className="flex gap-4 justify-end mt-8">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || loading}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition disabled:opacity-50"
            >
              {verifying ? 'Verifying…' : 'Verify Details'}
            </button>

            <button
              type="submit"
              disabled={loading || verifying}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Processing…' : 'Submit Transaction'}
            </button>
          </div>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              isError ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
            role="status"
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
