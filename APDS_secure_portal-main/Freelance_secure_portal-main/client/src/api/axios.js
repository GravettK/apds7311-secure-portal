import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true, // send/receive the httpOnly cookie
});

// Attach CSRF token for unsafe methods using double-submit cookie pattern
api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const match = document.cookie.match(/(?:^|; )csrfToken=([^;]+)/);
    const csrf = match ? decodeURIComponent(match[1]) : '';
    if (csrf) {
      config.headers = config.headers || {};
      config.headers['x-csrf-token'] = csrf;
    }
  }
  return config;
});

export default api;
