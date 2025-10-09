import React, { useState } from 'react';
import axios from 'axios';

const patterns = {
accountNumber: /^\d{8,16}$/,
swift: /^[A-Za-z0-9]{8}([A-Za-z0-9]{3})?$/,
currency: /^(ZAR|USD|EUR|GBP)$/,
};

export default function Payment() {
const [form, setForm] = useState({ accountNumber: '', swift: '', amount: '', currency: 'ZAR' });
const [errors, setErrors] = useState({});
const [message, setMessage] = useState('');

function handleChange(e) {
setForm({ ...form, [e.target.name]: e.target.value });
setErrors(prev => ({ ...prev, [e.target.name]: '' }));
}

function validate() {
const errs = {};
if (!patterns.accountNumber.test(form.accountNumber)) errs.accountNumber = 'Account number must be 8–16 digits.';
if (!patterns.swift.test(form.swift)) errs.swift = 'SWIFT must be 8 or 11 alphanumeric characters.';
const amt = Number(form.amount);
if (!form.amount || Number.isNaN(amt) || amt <= 0) errs.amount = 'Enter a positive amount.';
if (!patterns.currency.test(form.currency)) errs.currency = 'Currency must be ZAR, USD, EUR or GBP.';


setErrors(errs);
return Object.keys(errs).length === 0;
}

async function handleSubmit(e) {
e.preventDefault();
setMessage('');
if (!validate()) return;


// example axios call when backend ready:
// try {
// const res = await axios.post('/api/payment', form);
// setMessage('Payment successful');
// } catch (err) {
// setMessage('Payment failed: ' + (err.response?.data?.message || err.message));
// }


setMessage('Validation passed — ready to send to backend.');
}

return (
    <div style={{ maxWidth: 500 }}>
      <h3>Payment</h3>
      <form onSubmit={handleSubmit} noValidate>
        <label>Account number</label>
        <input name="accountNumber" value={form.accountNumber} onChange={handleChange} />
        {errors.accountNumber && <div className="error">{errors.accountNumber}</div>}


        <label>SWIFT code</label>
        <input name="swift" value={form.swift} onChange={handleChange} />
        {errors.swift && <div className="error">{errors.swift}</div>}

        <label>Amount</label>
        <input name="amount" value={form.amount} onChange={handleChange} placeholder="e.g. 100.00" />
        {errors.amount && <div className="error">{errors.amount}</div>}


        <label>Currency</label>
        <select name="currency" value={form.currency} onChange={handleChange}>
            <option value="ZAR">ZAR</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
        </select>
        {errors.currency && <div className="error">{errors.currency}</div>}


        <div style={{ marginTop: 12 }}>
            <button type="submit">Pay</button>
        </div>
      </form>


        {message && <div style={{ marginTop: 12 }}>{message}</div>}
    </div>
);
}