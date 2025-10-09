import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';


export default function App() {
return (
<BrowserRouter>
<div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
<h2>Customer UI — Auth & Payment</h2>
<nav style={{ marginBottom: 20 }}>
<Link to="/register" style={{ marginRight: 12 }}>Register</Link>
<Link to="/login" style={{ marginRight: 12 }}>Login</Link>
<Link to="/payment">Payment</Link>
</nav>


<Routes>
 <Route path="/" element={<Navigate to="/register" replace />} />
<Route path="/register" element={<Register />} />
<Route path="/login" element={<Login />} />
<Route path="/payment" element={<Payment />} />
</Routes>
</div>
</BrowserRouter>
);
}