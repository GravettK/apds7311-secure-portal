import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';
import Staff from './pages/Staff';
import Transaction from './pages/Transaction';
import TransactionDetail from './pages/TransactionDetail';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import './App.css';
import './style.css';
import { logout as apiLogout } from './api/auth';
import { useNavigate } from 'react-router-dom';
import { CircularProgress } from '@mui/material';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function HeaderNav() {
  const { role, loading, refresh } = useAuthContext();
  const navigate = useNavigate();
  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    await refresh?.();
    navigate('/login', { replace: true });
  };
  // While loading, show minimal nav to avoid flicker
  const isCustomer = role === 'customer';
  const isEmployee = role === 'employee';
  return (
    <nav className="top-nav">
      <div className="nav-links">
        {!role && (
          <>
            <NavLink to="/register" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Register</NavLink>
            <NavLink to="/login" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Login</NavLink>
          </>
        )}
        {isCustomer && (
          <NavLink to="/payment" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Payment</NavLink>
        )}
        {isEmployee && (
          <NavLink to="/staff" className={({isActive}) => `nav-link${isActive ? ' active' : ''}`}>Staff</NavLink>
        )}
        {loading && (
          <span style={{ display: 'inline-flex', alignItems: 'center', paddingLeft: 8 }}>
            <CircularProgress size={16} />
          </span>
        )}
        {!!role && (
          <button type="button" className="nav-link" onClick={onLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <div className="gradient-bg">
          <header className="main-header">
            <div className="header-content">
              <h1 className="bank-title">SECURE PAYMENT SYSTEM</h1>
              <HeaderNav />
            </div>
          </header>

          <main className="glass-card" style={{ maxWidth: 980, margin: '24px auto', padding: 20 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/register" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/payment" element={<ProtectedRoute roles={['customer']}><Payment /></ProtectedRoute>} />
              <Route path="/staff" element={<ProtectedRoute roles={['employee']}><Staff /></ProtectedRoute>} />
              <Route path="/transaction/:id" element={<ProtectedRoute roles={['employee']}><TransactionDetail /></ProtectedRoute>} />
              <Route path="/transaction" element={<ProtectedRoute roles={['customer']}><Transaction /></ProtectedRoute>} />
              <Route path="*" element={<div>404 — Page not found</div>} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
