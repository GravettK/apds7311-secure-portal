import { useState, useEffect } from 'react';
import axios from 'axios';

const https = require('https');

export default function TransactionVerification() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const employeeId = localStorage.getItem('employeeId');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token && employeeId) fetchPending();
  }, [token, employeeId]);

  const fetchPending = async () => {
    try {
      const res = await axios.get('https://localhost:8443/api/transactions/pending', {
        headers: { Authorization: `Bearer ${token}` },
        httpsAgent: new https.Agent({ rejectUnauthorized: false })
      });
      setPayments(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load payments. Are you logged in as employee?');
    }
  };

  const verifyAndSubmit = async (id) => {
    if (!window.confirm('Submit this payment to SWIFT?')) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `https://localhost:8443/api/transactions/${id}/verify`,
        { verifiedBy: employeeId },
        {
          headers: { Authorization: `Bearer ${token}` },
          httpsAgent: new https.Agent({ rejectUnauthorized: false })
        }
      );
      alert(`Payment ${id} submitted to SWIFT!`);
      console.log('SWIFT MT103:', res.data.swiftMessage);
      fetchPending();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!token || !employeeId) {
    return <div>Please login as employee.</div>;
  }

  return (
    <div style={{ padding: 20, fontFamily: 'Arial' }}>
      <h1 style={{ color: '#1d4ed8' }}>Employee Verification Portal</h1>
      <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <h2>Pending Payments</h2>
        {payments.length === 0 ? (
          <p>No pending payments.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={th}>ID</th>
                <th style={th}>Customer</th>
                <th style={th}>Amount</th>
                <th style={th}>Purpose</th>
                <th style={th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={td}>{p.id}</td>
                  <td style={td}>{p.customerName}</td>
                  <td style={td}><strong>{p.amount} {p.currency}</strong></td>
                  <td style={td}>{p.purpose}</td>
                  <td style={td}>
                    <button onClick={() => verifyAndSubmit(p.id)} disabled={loading} style={btn}>
                      {loading ? 'Submitting...' : 'Verify & Submit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const th = { padding: '12px', border: '1px solid #ddd', textAlign: 'left' };
const td = { padding: '12px', border: '1px solid #ddd' };
const btn = { background: '#059669', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' };