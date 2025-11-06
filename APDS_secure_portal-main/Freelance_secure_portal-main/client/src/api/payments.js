import api from './axios';

export const createPayment = (payload) => api.post('/payments', payload);
export const listMyPayments = () => api.get('/payments');
// staff
export const listStaffPayments = (status = 'PENDING') => api.get(`/staff/payments`, { params: { status } });
export const verifyPayment  = (payload) => api.post('/staff/verify', payload);
export const submitPayment  = (payload) => api.post('/staff/submit', payload);
