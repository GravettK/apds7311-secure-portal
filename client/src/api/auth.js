import api from './axios';

export const register = (payload) =>
  api.post('/api/auth/register', payload).then(r => r.data);

export const login = (payload) =>
  api.post('/api/auth/login', payload).then(r => r.data);

export const logout = () =>
  api.post('/api/auth/logout').then(r => r.data);
