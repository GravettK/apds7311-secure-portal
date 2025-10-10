import api from './axios';

export const createPayment = (payload) => api.post('/payments', payload);
// staff (optional)
export const verifyPayment  = (payload) => api.post('/staff/verify', payload);
export const submitPayment  = (payload) => api.post('/staff/submit', payload);
