import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';
import TransactionVerification from './pages/TransactionVerification';

function EmployeeRoute({ children }) {
  const role = localStorage.getItem('role');
  return role === 'employee' ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
        <h2>Secure Banking Portal</h2>
        <nav style={{ marginBottom: 20 }}>
          <Link to="/register" style={{ marginRight: 12 }}>Register</Link>
          <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
          <Link to="/payment" style={{ marginRight: 12 }}>Payment</Link>
          {localStorage.getItem('role') === 'employee' && (
            <Link to="/verify" style={{ marginRight: 12, color: 'green', fontWeight: 'bold' }}>
              Verify Payments
            </Link>
          )}
        </nav>

        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/verify" element={<EmployeeRoute><TransactionVerification /></EmployeeRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}