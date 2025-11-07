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
            />
            {errors.accountNumber && <div className="text-red-500 text-sm mt-1">{errors.accountNumber}</div>}
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
            />
            {errors.swift && <div className="text-red-500 text-sm mt-1">{errors.swift}</div>}
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
            />
            {errors.amount && <div className="text-red-500 text-sm mt-1">{errors.amount}</div>}
          </div>

          <div className="form-group">
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              name="currency"
              className="w-full p-3 border rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.currency}
              onChange={handleChange}
            >
              <option value="ZAR">ZAR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
            {errors.currency && <div className="text-red-500 text-sm mt-1">{errors.currency}</div>}
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
            />
            {errors.description && <div className="text-red-500 text-sm mt-1">{errors.description}</div>}
          </div>

          <div className="flex gap-4 justify-end mt-8">
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying || loading}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify Details'}
            </button>

            <button
              type="submit"
              disabled={loading || verifying}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Transaction'}
            </button>
          </div>
        </form>

        {message && (
          <div className={`mt-6 p-4 rounded-lg ${
            message.toLowerCase().includes('fail') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}