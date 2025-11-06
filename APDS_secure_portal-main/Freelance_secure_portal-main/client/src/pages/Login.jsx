import React, { useState } from 'react';
import api from '../api/axios';
import { TextField, Button, Paper, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!emailPattern.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password.trim()) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;

    try {
      await api.post('/auth/login', form);
      setMessage('Login successful. Redirecting...');
      setTimeout(() => navigate('/payment'), 700);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please try again.';
      setMessage(` ${msg}`);
    }
  };

  return (
    <Paper elevation={2} sx={{ maxWidth: 420, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Login</Typography>
      <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
        <TextField label="Email" name="email" value={form.email} onChange={handleChange}
          error={!!errors.email} helperText={errors.email} autoComplete="username" fullWidth />
        <TextField label="Password" type="password" name="password" value={form.password} onChange={handleChange}
          error={!!errors.password} helperText={errors.password} autoComplete="current-password" fullWidth />
        <Button type="submit" variant="contained">Login</Button>
        {message && <Typography color={message.includes('success') ? 'primary' : 'error'}>{message}</Typography>}
      </Stack>
    </Paper>
  );
}
