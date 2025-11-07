// client/src/App.jsx
import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  Link as RouterLink,
} from 'react-router-dom';

import Register from './pages/Register';
import Login from './pages/Login';
import Payment from './pages/Payment';
import Transaction from './pages/Transaction';
import Staff from './pages/Staff';

import api from './api/axios'; // your axios instance

// MUI
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const theme = createTheme({
  palette: {
    primary: { main: '#52B788' },
    background: { default: '#f7faf9' },
  },
});

export default function App() {
  const [healthOpen, setHealthOpen] = useState(false);
  const [healthMsg, setHealthMsg] = useState('');
  const [healthLoading, setHealthLoading] = useState(false);

  async function checkHealth() {
    setHealthLoading(true);
    try {
      const { data } = await api.get('/health', { timeout: 6000 });
      // Be defensive about shape:
      const env = data?.env ?? 'unknown';
      const dbOk = data?.db?.ok === true ? 'up' : 'down';
      setHealthMsg(`OK (env: ${env}) • DB: ${dbOk}`);
    } catch (e) {
      setHealthMsg('Health check failed');
    } finally {
      setHealthLoading(false);
      setHealthOpen(true);
    }
  }

  // Helper for active nav styling
  const linkButton = ({ to, children }) => (
    <Button
      component={NavLink}
      to={to}
      sx={{
        '&.active': {
          color: 'primary.main',
          fontWeight: 700,
        },
      }}
    >
      {children}
    </Button>
  );

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            minHeight: '100vh',
            background:
              'linear-gradient(120deg, rgba(82,183,136,0.08), rgba(253,216,53,0.08))',
          }}
        >
          <AppBar position="sticky" color="inherit" elevation={1}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Customer UI — Auth & Payment
              </Typography>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {linkButton({ to: '/register', children: 'Register' })}
                {linkButton({ to: '/login', children: 'Login' })}
                {linkButton({ to: '/payment', children: 'Payment' })}
                {linkButton({ to: '/transaction', children: 'Transaction' })}

                <Button
                  variant="contained"
                  color="primary"
                  component={RouterLink}
                  to="/staff"
                >
                  Staff
                </Button>

                <Button onClick={checkHealth} disabled={healthLoading}>
                  {healthLoading ? 'Health…' : 'Health'}
                </Button>
              </Box>
            </Toolbar>
          </AppBar>

          <Container maxWidth="md" sx={{ py: 4 }}>
            <Routes>
              <Route path="/" element={<Navigate to="/register" replace />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/payment" element={<Payment />} />
              <Route path="/transaction" element={<Transaction />} />
              <Route path="/staff" element={<Staff />} />
              <Route path="*" element={<div>Not found</div>} />
            </Routes>
          </Container>

          <Snackbar
            open={healthOpen}
            autoHideDuration={4000}
            onClose={() => setHealthOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert
              severity={healthMsg.startsWith('OK') ? 'success' : 'error'}
              sx={{ width: '100%' }}
              onClose={() => setHealthOpen(false)}
            >
              {healthMsg}
            </Alert>
          </Snackbar>
        </Box>
      </ThemeProvider>
    </Router>
  );
}
