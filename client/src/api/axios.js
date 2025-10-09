import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'https://localhost:3001';

const api = axios.create({
  baseURL,
  withCredentials: true,            // send/receive cookies (your login sets a cookie)
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Optional: basic response normalization
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.error || err.message || 'Request failed';
    return Promise.reject(new Error(msg));
  }
);

export default api;