import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStaffPayment, verifyPayment, submitPayment } from '../api/payments';
import { Paper, Typography, Stack, Button, Divider, Snackbar, Alert } from '@mui/material';

export default function TransactionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [row, setRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await getStaffPayment(id);
      setRow(data.payment);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 401 || code === 403) navigate('/login', { state: { from: `/transaction/${id}` } });
      else setMsg(e?.response?.data?.error || 'Failed to load payment');
    } finally { setBusy(false); }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const onVerify = async () => {
    if (!row) return;
    setBusy(true); setMsg('');
    try {
      await verifyPayment({ paymentId: String(row.payment_id) });
      setMsg('Payment verified');
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Verify failed');
    } finally { setBusy(false); }
  };

  const onSubmitSwift = async () => {
    if (!row) return;
    const swiftRef = window.prompt('Enter SWIFT reference');
    if (!swiftRef) return;
    setBusy(true); setMsg('');
    try {
      await submitPayment({ paymentId: String(row.payment_id), swiftRef });
      setMsg('Submitted to SWIFT');
      navigate('/staff', { replace: true, state: { toast: `Submitted: ${swiftRef}` } });
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Submit failed');
    } finally { setBusy(false); }
  };

  return (
    <Paper elevation={2} sx={{ maxWidth: 720, mx: 'auto', mt: 6, p: 3, bgcolor: '#fff', borderRadius: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Payment Detail</Typography>
        <Button onClick={() => navigate('/staff')}>Back to Staff</Button>
      </Stack>
      <Divider sx={{ my: 2 }} />
      {!row && (<Typography>Loading…</Typography>)}
      {row && (
        <Stack spacing={1}>
          <Typography>ID: {row.payment_id}</Typography>
          <Typography>Customer: {row.customer_id}</Typography>
          <Typography>Amount: {(row.amount_cents/100).toFixed(2)} {row.currency}</Typography>
          <Typography>Status: {row.status}</Typography>
          {row.swift_ref && <Typography>SWIFT Ref: {row.swift_ref}</Typography>}
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={onVerify} disabled={busy || row.status !== 'PENDING'}>
              Verify
            </Button>
            <Button variant="contained" onClick={onSubmitSwift} disabled={busy || row.status !== 'VERIFIED'}>
              Submit to SWIFT
            </Button>
          </Stack>
        </Stack>
      )}
      <Snackbar open={!!msg} autoHideDuration={4000} onClose={() => setMsg('')}>
        <Alert severity={msg.toLowerCase().includes('fail') ? 'error' : 'info'}>{msg}</Alert>
      </Snackbar>
    </Paper>
  );
}
