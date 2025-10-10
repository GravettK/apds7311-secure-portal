import React, { useState } from 'react';
import api from '../api/axios'; // uses your axios instance with baseURL & credentials

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

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
      const res = await api.post('/auth/login', form);
      setMessage('Login successful. Redirecting...');
      // optional redirect after a short delay:
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please try again.';
      setMessage(` ${msg}`);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h3>Login</h3>
      <form onSubmit={handleSubmit} noValidate>
        <label>Email</label>
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          autoComplete="username"
        />
        {errors.email && <div className="error">{errors.email}</div>}

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          autoComplete="current-password"
        />
        {errors.password && <div className="error">{errors.password}</div>}

        <div style={{ marginTop: 12 }}>
          <button type="submit">Login</button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: 12, color: message.startsWith('✅') ? 'green' : 'red' }}>
          {message}
        </div>
      )}
    </div>
  );
}
