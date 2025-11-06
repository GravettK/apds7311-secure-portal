import React, { useState } from 'react';
import api from '../api/axios';
import { TextField, Button, Paper, Typography, Stack } from '@mui/material';

const patterns = {
saId: /^\d{13}$/, // exactly 13 digits
accountNumber: /^\d{8,16}$/, // 8 to 16 digits
swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/, // 8 or 11 alphanumeric
email: /^\S+@\S+\.\S+$/,
currency: /^(ZAR|USD|EUR|GBP)$/,
};

export default function Register() {
const [form, setForm] = useState({
fullName: '',
saId: '',
email: '',
password: '',
confirmPassword: '',
  accountNumber: '',
});

const [errors, setErrors] = useState({});
const [message, setMessage] = useState('');


function handleChange(e) {
setForm({ ...form, [e.target.name]: e.target.value });
// Clear single-field error on change
setErrors(prev => ({ ...prev, [e.target.name]: '' }));
}

function validate() {
const errs = {};
if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
if (!patterns.saId.test(form.saId)) errs.saId = 'SA ID must be exactly 13 digits.';
if (!patterns.email.test(form.email)) errs.email = 'Enter a valid email address.';
if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.';
if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
if (!patterns.accountNumber.test(form.accountNumber)) errs.accountNumber = 'Account number must be 8–16 digits.';
  // registration does not include swift/currency


setErrors(errs);
return Object.keys(errs).length === 0;
}

async function handleSubmit(e) {
  e.preventDefault();
  setMessage('');
  if (!validate()) return;
  try {
    await api.post('/auth/register', {
      fullName: form.fullName.trim(),
      saId: form.saId.trim(),
      email: form.email.trim(),
      password: form.password,
      accountNumber: form.accountNumber.trim(),
    });
    setMessage('Registration successful. You can now log in.');
  } catch (err) {
    const msg = err?.response?.data?.error || 'Registration failed';
    setMessage(msg);
  }
}


return (
  <Paper elevation={2} sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
    <Typography variant="h5" gutterBottom>Register</Typography>
    <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
      <TextField label="Full name" name="fullName" value={form.fullName} onChange={handleChange}
        error={!!errors.fullName} helperText={errors.fullName} fullWidth />
      <TextField label="SA ID" name="saId" value={form.saId} onChange={handleChange} placeholder="13 digits"
        error={!!errors.saId} helperText={errors.saId} fullWidth />
      <TextField label="Email" name="email" value={form.email} onChange={handleChange}
        error={!!errors.email} helperText={errors.email} fullWidth />
      <TextField label="Password" type="password" name="password" value={form.password} onChange={handleChange}
        error={!!errors.password} helperText={errors.password} fullWidth />
      <TextField label="Confirm password" type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
        error={!!errors.confirmPassword} helperText={errors.confirmPassword} fullWidth />
      <TextField label="Account number" name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="8-16 digits"
        error={!!errors.accountNumber} helperText={errors.accountNumber} fullWidth />
      <Button type="submit" variant="contained">Register</Button>
      {message && <Typography color={message.includes('successful') ? 'primary' : 'error'}>{message}</Typography>}
    </Stack>
  </Paper>
);
}
