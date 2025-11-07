import axios from 'axios';

// Prefer HTTPS API, optionally fall back to a local HTTP dev port to avoid self-signed cert issues
const PRIMARY_API_URL = (process.env.REACT_APP_API_URL || 'https://localhost:8443/api').replace(/\/$/, '');
const FALLBACK_API_URL = (process.env.REACT_APP_API_FALLBACK_URL || 'http://localhost:8084/api').replace(/\/$/, '');

function readCookie(name) {
  const m = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

const api = axios.create({
  baseURL: PRIMARY_API_URL,
  withCredentials: true,
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const method = (config.method || 'get').toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrf = readCookie('csrfToken');
    if (csrf) {
      config.headers = config.headers || {};
      config.headers['x-csrf-token'] = csrf;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // If unauthorized, let callers handle (many pages redirect to /login)
    if (err?.response?.status === 401) {
      return Promise.reject(err);
    }

    // Network/SSL issues: attempt ONE retry against fallback baseURL in development
    const cfg = err?.config || {};
    const isNetwork = !err?.response && (err?.code === 'ERR_NETWORK' || typeof err?.message === 'string');
    const canFallback = !!FALLBACK_API_URL && PRIMARY_API_URL !== FALLBACK_API_URL;
    const notRetriedYet = !cfg._retriedWithFallback;

    if (isNetwork && canFallback && notRetriedYet) {
      const retryCfg = {
        ...cfg,
        baseURL: FALLBACK_API_URL,
        _retriedWithFallback: true,
        headers: { ...(cfg.headers || {}) },
      };
      if (typeof window !== 'undefined' && window?.console) {
        // eslint-disable-next-line no-console
        console.warn('[api] Network error. Retrying with fallback baseURL:', FALLBACK_API_URL);
      }
      return axios(retryCfg);
    }

    return Promise.reject(err);
  }
);

export default api;
