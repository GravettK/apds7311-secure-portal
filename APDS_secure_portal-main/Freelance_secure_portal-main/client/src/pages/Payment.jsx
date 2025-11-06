import React, { useState } from 'react';
import api from '../api/axios';
import { TextField, Button, Paper, Typography, Stack, MenuItem } from '@mui/material';

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
  <Paper elevation={2} sx={{ maxWidth: 560, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
    <Typography variant="h5" gutterBottom>New Payment</Typography>
    <Stack component="form" spacing={2} onSubmit={onSubmit} noValidate>
      <TextField label="Destination account" name="accountTo" value={form.accountTo} onChange={onChange}
        error={!!errors.accountTo} helperText={errors.accountTo} inputMode="numeric" autoComplete="off" fullWidth />
      <TextField label="SWIFT / BIC" name="swift" value={form.swift} onChange={onChange}
        error={!!errors.swift} helperText={errors.swift} autoComplete="off" fullWidth />
      <TextField label="Amount" name="amount" value={form.amount} onChange={onChange} inputMode="decimal"
        placeholder="e.g. 100.00" error={!!errors.amount} helperText={errors.amount} autoComplete="off" fullWidth />
      <TextField select label="Currency" name="currency" value={form.currency} onChange={onChange}
        error={!!errors.currency} helperText={errors.currency} fullWidth>
        {['ZAR','USD','EUR','GBP'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>
      <TextField label="Purpose (optional)" name="purpose" value={form.purpose} onChange={onChange} inputProps={{ maxLength: 255 }} fullWidth />
      <Button type="submit" variant="contained" disabled={busy}>{busy ? 'Processing…' : 'Pay'}</Button>
      {msg && <Typography aria-live="polite">{msg}</Typography>}
    </Stack>
  </Paper>
);
}
