const crypto = require('crypto');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function setCsrfCookie(res) {
  const token = generateToken();
  res.cookie('csrfToken', token, {
    httpOnly: false,
    secure: (process.env.NODE_ENV || 'development') === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000
  });
  return token;
}

function requireCsrf(req, res, next) {
  const method = (req.method || 'GET').toUpperCase();
  const unsafe = method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE';
  if (!unsafe) return next();

  // Allow auth bootstrap routes (no CSRF token yet)
  if (req.path && (
      req.path.startsWith('/api/auth/login') ||
      req.path.startsWith('/api/auth/register')
    )) return next();

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = req.cookies?.csrfToken;
  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({ error: 'CSRF validation failed' });
  }
  next();
}

module.exports = { setCsrfCookie, requireCsrf };


