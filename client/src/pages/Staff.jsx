import React, { useEffect, useState, useCallback } from 'react';
import { listStaffPayments, verifyPayment, submitPayment } from '../api/payments';
import { useNavigate } from 'react-router-dom';
import { Paper, Typography, Button, Stack, ToggleButtonGroup, ToggleButton, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert } from '@mui/material';

export default function Staff() {
  const [status, setStatus] = useState('PENDING');
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await listStaffPayments(status);
      setRows(data.payments || []);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) {
        setMsg('Please login with an employee account.');
        navigate('/login');
      } else {
        setMsg(e?.response?.data?.error || 'Failed to load payments');
      }
    } finally {
      setBusy(false);
    }
  }, [status, navigate]);

  useEffect(() => { load(); }, [load]);

  const onVerify = async (paymentId) => {
    setMsg('');
    try {
      await verifyPayment({ paymentId: String(paymentId) });
      setMsg('Verified');
      load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Verify failed');
    }
  };

  const onSubmitSwift = async (paymentId) => {
    const swiftRef = window.prompt('Enter SWIFT reference');
    if (!swiftRef) return;
    setMsg('');
    try {
      await submitPayment({ paymentId: String(paymentId), swiftRef });
      setMsg('Submitted to SWIFT');
      load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Submit failed');
    }
  };

  return (
    <Paper elevation={2} sx={{ maxWidth: 960, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>Employee Portal</Typography>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <ToggleButtonGroup exclusive value={status} onChange={(_, v) => v && setStatus(v)}>
          <ToggleButton value="PENDING">Pending</ToggleButton>
          <ToggleButton value="VERIFIED">Verified</ToggleButton>
        </ToggleButtonGroup>
        <Button onClick={load} disabled={busy}>Refresh</Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Currency</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.payment_id} hover>
              <TableCell>{r.payment_id}</TableCell>
              <TableCell>{r.customer_id || '-'}</TableCell>
              <TableCell>{(r.amount_cents/100).toFixed(2)}</TableCell>
              <TableCell>{r.currency}</TableCell>
              <TableCell>{r.status}</TableCell>
              <TableCell>
                {status === 'PENDING' && (
                  <Button size="small" onClick={() => onVerify(r.payment_id)}>Verify</Button>
                )}
                {status === 'VERIFIED' && (
                  <Button size="small" variant="contained" onClick={() => onSubmitSwift(r.payment_id)}>Submit to SWIFT</Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow><TableCell colSpan={6}>No records</TableCell></TableRow>
          )}
        </TableBody>
      </Table>

      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg('')}>
        <Alert severity={msg.toLowerCase().includes('fail') ? 'error' : 'info'}>{msg}</Alert>
      </Snackbar>
    </Paper>
  );
}


