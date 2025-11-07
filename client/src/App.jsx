import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';
import Staff from './pages/Staff';
import Transaction from './pages/Transaction';
import './App.css';
import './style.css';

export default function App() {
	return (
			<BrowserRouter>
				<div className="gradient-bg">
					<header className="main-header">
						<div className="header-content">
							<h1 className="bank-title">SECURE PAYMENT SYSTEM</h1>
							<nav className="top-nav">
								<div className="nav-links">
									<Link to="/register" className="nav-link">Register</Link>
									<Link to="/login" className="nav-link">Login</Link>
									<Link to="/payment" className="nav-link">Payment</Link>
									<Link to="/staff" className="nav-link">Staff</Link>
									<Link to="/transaction" className="nav-link">Transaction</Link>
								</div>
							</nav>
						</div>
					</header>
					<div className="glass-card" style={{ maxWidth: 980, margin: '24px auto', padding: 20 }}>

						<Routes>
							<Route path="/" element={<Navigate to="/register" replace />} />
							<Route path="/register" element={<Register />} />
							<Route path="/login" element={<Login />} />
							<Route path="/payment" element={<Payment />} />
							<Route path="/staff" element={<Staff />} />
							<Route path="/transaction" element={<Transaction />} />
						</Routes>
					</div>
				</div>
			</BrowserRouter>
	);
}
