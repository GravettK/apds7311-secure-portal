import React, { useState } from 'react';
import api from '../api/axios';
import { TextField, Button, Paper, Typography, Stack } from '@mui/material';

const patterns = {
  saId: /^\d{13}$/,
  accountNumber: /^\d{8,16}$/,
  email: /^\S+@\S+\.\S+$/,
  // at least 8 chars, must contain letters and numbers
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d\S]{8,}$/,
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
  const [submitting, setSubmitting] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setMessage('');
  }

  function validate() {
    const errs = {};
      // Server expects a full name that starts and ends with a letter and allows spaces, apostrophes and hyphens
      const fullNamePattern = /^[A-Za-z][A-Za-z '\-]{1,148}[A-Za-z]$/;
      if (!form.fullName.trim()) errs.fullName = 'Full name is required.';
      else if (!fullNamePattern.test(form.fullName.trim())) errs.fullName = 'Enter a valid full name (letters, spaces, \'- ).';
    if (!patterns.saId.test(form.saId)) errs.saId = 'SA ID must be exactly 13 digits.';
    if (!patterns.email.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!patterns.password.test(form.password)) {
      errs.password = 'Password must be 8+ chars and include letters & numbers.';
    }
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    if (!patterns.accountNumber.test(form.accountNumber)) {
      errs.accountNumber = 'Account number must be 8–16 digits.';
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
      // Map fullName -> name to match backend route expectation
      const payload = {
          fullName: form.fullName.trim(),
        saId: form.saId.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        accountNumber: form.accountNumber.trim(),
      };

      await api.post('/auth/register', payload);
      setMessage('Registration successful. You can now log in.');
      // optional clear
      // setForm({ fullName: '', saId: '', email: '', password: '', confirmPassword: '', accountNumber: '' });
    } catch (err) {
        // Prefer detailed validation messages from the server if present
        const resp = err?.response?.data;
        if (resp) {
          if (Array.isArray(resp.details) && resp.details.length > 0) {
            const detailMsg = resp.details.map(d => `${d.path}: ${d.message}`).join('; ');
            setMessage(detailMsg);
          } else if (resp.error) {
            setMessage(resp.error);
          } else {
            setMessage('Registration failed');
          }
        } else {
          setMessage('Registration failed: ' + (err.message || 'unknown error'));
        }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Paper elevation={2} sx={{ maxWidth: 600, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Register</Typography>

      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
          error={!!errors.fullName}
          helperText={errors.fullName}
          fullWidth
          autoComplete="name"
        />

        <TextField
          label="SA ID"
          name="saId"
          value={form.saId}
          onChange={handleChange}
          error={!!errors.saId}
          helperText={errors.saId}
          fullWidth
          inputMode="numeric"
          placeholder="13 digits"
        />

        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          fullWidth
          autoComplete="email"
        />

        <TextField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          fullWidth
          autoComplete="new-password"
        />

        <TextField
          label="Confirm password"
          type="password"
          name="confirmPassword"
          value={form.confirmPassword}
          onChange={handleChange}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword}
          fullWidth
          autoComplete="new-password"
        />

        <TextField
          label="Account number"
          name="accountNumber"
          value={form.accountNumber}
          onChange={handleChange}
          error={!!errors.accountNumber}
          helperText={errors.accountNumber}
          fullWidth
          inputMode="numeric"
          placeholder="8–16 digits"
          autoComplete="off"
        />

        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Register'}
        </Button>

        {message && (
          <Typography color={message.toLowerCase().includes('success') ? 'primary' : 'error'}>
            {message}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
