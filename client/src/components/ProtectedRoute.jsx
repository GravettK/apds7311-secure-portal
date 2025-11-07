import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();
  const { role, loading } = useAuthContext();
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 160 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }
  const want = (roles || []).map(r => String(r).toLowerCase());
  const ok = want.length === 0 || want.includes(String(role || '').toLowerCase());
  if (!ok) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return children;
}
