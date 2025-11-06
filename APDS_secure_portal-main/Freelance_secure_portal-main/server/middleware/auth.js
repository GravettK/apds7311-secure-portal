// server/middleware/auth.js
const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const token =
    req.cookies?.token ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { sub, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

auth.requireRole = (roleName) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const have = String(req.user.role || '').toLowerCase();
  if (have !== String(roleName).toLowerCase()) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = auth;
