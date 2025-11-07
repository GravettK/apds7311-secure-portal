import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { TextField, Button, Paper, Typography, Stack } from '@mui/material';
import { useAuthContext } from '../context/AuthContext';

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuthContext();

  // If already authenticated, auto-redirect away from the login page
  useEffect(() => {
    if (auth.loading) return; // wait until auth check completes
    if (auth.role) {
      const defaultPath = auth.role === 'employee' ? '/staff' : '/payment';
      const fromState = location.state?.from;
      const dest = fromState && fromState !== '/login' ? fromState : defaultPath;
      navigate(dest, { replace: true });
    }
  }, [auth.loading, auth.role, location.state, navigate]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setMessage('');
  }

  function validate() {
    const errs = {};
    if (!emailPattern.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password.trim()) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await api.post('/auth/login', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      
      // Check if login was successful
      if (response.data?.ok) {
        // refresh role so nav updates immediately
        await auth.refresh?.();
        // Redirect to the page they came from, or role-based default
        const defaultPath = auth?.role === 'employee' ? '/staff' : '/payment';
        const from = location.state?.from || defaultPath;
        navigate(from, { replace: true });
      } else {
        setMessage('Login failed. Please try again.');
      }
    } catch (err) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (status === 401 ? 'Invalid email or password.' : 'Login failed. Please try again.');
      setMessage(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const success = message.toLowerCase().includes('success');

  return (
    <Paper elevation={2} sx={{ maxWidth: 420, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={!!errors.email}
          helperText={errors.email}
          autoComplete="username"
          fullWidth
        />
        <TextField
          label="Password"
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          error={!!errors.password}
          helperText={errors.password}
          autoComplete="current-password"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Login'}
        </Button>
        {message && (
          <Typography role="status" color={success ? 'primary' : 'error'}>
            {message}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
}
