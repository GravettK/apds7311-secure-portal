import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';
import Staff from './pages/Staff';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import api from './api/axios';

const theme = createTheme({
  palette: {
    primary: { main: '#52B788' },
  },
});


export default function App() {
const [healthOpen, setHealthOpen] = useState(false);
const [healthMsg, setHealthMsg] = useState('');

async function checkHealth() {
  try {
    const { data } = await api.get('/health');
    setHealthMsg(`OK (env: ${data.env}) DB: ${data.db?.ok ? 'up' : 'down'}`);
  } catch (e) {
    setHealthMsg('Health check failed');
  } finally {
    setHealthOpen(true);
  }
}
return (
<BrowserRouter>
<ThemeProvider theme={theme}>
<Box className="gradient-bg">
<AppBar position="static" color="inherit" elevation={1}>
  <Toolbar>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>Customer UI — Auth & Payment</Typography>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button component={Link} to="/register">Register</Button>
      <Button component={Link} to="/login">Login</Button>
      <Button component={Link} to="/payment">Payment</Button>
      <Button variant="contained" color="primary" component={Link} to="/staff">Staff</Button>
      <Button onClick={checkHealth}>Health</Button>
    </Box>
  </Toolbar>
</AppBar>
<Container maxWidth="md" sx={{ py: 4 }}>


<Routes>
 <Route path="/" element={<Navigate to="/register" replace />} />
<Route path="/register" element={<Register />} />
<Route path="/login" element={<Login />} />
<Route path="/payment" element={<Payment />} />
<Route path="/staff" element={<Staff />} />
</Routes>
</Container>
<Snackbar open={healthOpen} autoHideDuration={4000} onClose={() => setHealthOpen(false)}>
  <Alert severity={healthMsg.startsWith('OK') ? 'success' : 'error'} sx={{ width: '100%' }}>
    {healthMsg}
  </Alert>
</Snackbar>
</Box>
</ThemeProvider>
</BrowserRouter>
);
}
