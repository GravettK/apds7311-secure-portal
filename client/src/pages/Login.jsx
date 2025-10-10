import React, { useState } from 'react';
import api from '../api/axiosConfig';
import { useNavigate } from 'react-router-dom';

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
  }

  function validate() {
    const errs = {};
    if (!emailPattern.test(form.email)) errs.email = 'Enter a valid email.';
    if (!form.password) errs.password = 'Password is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/login', form);
      const token = res?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
        setMessage('Login successful.');
        navigate('/payment');
      } else {
        setMessage(res?.data?.message || 'Login succeeded (no token returned).');
      }
    } catch (err) {
      setMessage('Login failed: ' + (err?.message || JSON.stringify(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h3>Login</h3>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} />
          {errors.email && <div className="error">{errors.email}</div>}
        </div>

        <div className="form-row">
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} />
          {errors.password && <div className="error">{errors.password}</div>}
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
        </div>
      </form>

      {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
  );
}