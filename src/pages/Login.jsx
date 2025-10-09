import React, { useState } from 'react';
import axios from 'axios';

const emailPattern = /^\S+@\S+\.\S+$/;

export default function Login() {
const [form, setForm] = useState({ email: '', password: '' });
const [errors, setErrors] = useState({});
const [message, setMessage] = useState('');

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


// axios example (uncomment when backend is live):
// try {
// const res = await axios.post('/api/login', form);
// setMessage('Login successful');
// } catch (err) {
// setMessage('Login failed: ' + (err.response?.data?.message || err.message));
// }


setMessage('Validation passed — ready to send to backend.');
}

return (
    <div style={{ maxWidth: 420 }}>
        <h3>Login</h3>
        <form onSubmit={handleSubmit} noValidate>
            <label>Email</label>
            <input name="email" value={form.email} onChange={handleChange} />
            {errors.email && <div className="error">{errors.email}</div>}


            <label>Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange} />
            {errors.password && <div className="error">{errors.password}</div>}


            <div style={{ marginTop: 12 }}>
                <button type="submit">Login</button>
            </div>
        </form>


            {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
);
}