import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://localhost:4000';

const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the httpOnly cookie when used
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach bearer token from localStorage when available
api.interceptors.request.use(cfg => {
  try {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch (e) {
    // ignore
  }
  return cfg;
}, e => Promise.reject(e));

// Normalize response errors to a predictable payload
api.interceptors.response.use(
  r => r,
  e => {
    const payload = e?.response?.data || { message: e?.message || 'Network error' };
    return Promise.reject(payload);
  }
);

export default api;
