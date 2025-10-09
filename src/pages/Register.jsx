import React, { useState } from 'react';
import axios from 'axios';

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
swift: '',
currency: 'ZAR',
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
if (!patterns.swift.test(form.swift)) errs.swift = 'SWIFT must be 8 or 11 alphanumeric characters.';
if (!patterns.currency.test(form.currency)) errs.currency = 'Currency must be ZAR, USD, EUR, or GBP.';


setErrors(errs);
return Object.keys(errs).length === 0;
}

async function handleSubmit(e) {
// setMessage('Registration successful!');
// } catch (err) {
// setMessage('Registration failed: ' + (err.response?.data?.message || err.message));
// }
// ========================================================


// For now (demo), just show success:
setMessage('Validation passed — ready to send to backend. (See console)');
console.log('Would send to backend:', form);
}


return (
    <div style={{ maxWidth: 600 }}>
        <h3>Register</h3>
            <form onSubmit={handleSubmit} noValidate>
                <label>Full name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} />
                {errors.fullName && <div className="error">{errors.fullName}</div>}


                <label>SA ID</label>
                <input name="saId" value={form.saId} onChange={handleChange} placeholder="13 digits" />
                {errors.saId && <div className="error">{errors.saId}</div>}


                <label>Email</label>
                <input name="email" value={form.email} onChange={handleChange} />
                {errors.email && <div className="error">{errors.email}</div>}


                <label>Password</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} />
                {errors.password && <div className="error">{errors.password}</div>}


                <label>Confirm password</label>
                <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <div className="error">{errors.confirmPassword}</div>}


                <label>Account number</label>
                <input name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="8-16 digits" />
                {errors.accountNumber && <div className="error">{errors.accountNumber}</div>}


                <label>SWIFT code</label>
                <input name="swift" value={form.swift} onChange={handleChange} placeholder="8 or 11 chars" />
                {errors.swift && <div className="error">{errors.swift}</div>}


                <label>Currency</label>
                <select name="currency" value={form.currency} onChange={handleChange}>
                    <option value="ZAR">ZAR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                </select>
                {errors.currency && <div className="error">{errors.currency}</div>}


                <div style={{ marginTop: 12 }}>
                    <button type="submit">Register</button>
                </div>
            </form>


{message && <div style={{ marginTop: 12 }}>{message}</div>}
</div>
);
}