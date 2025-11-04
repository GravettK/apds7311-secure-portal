import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:4000'; 

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    
  },

});


api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});


api.interceptors.response.use(
  r => r,
  e => {
    const payload = e?.response?.data || { message: e.message || 'Network error' };
    return Promise.reject(payload);
  }
);

export default api;