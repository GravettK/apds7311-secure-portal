// server/middleware/auth.js
const jwt = require('jsonwebtoken');

function parseBearer(header) {
  if (!header) return null;
  const m = header.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

function auth(req, res, next) {
  const token =
    req.cookies?.token ||
    parseBearer(req.headers.authorization);

  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { sub, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

auth.requireRole = (roleName) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const have = String(req.user.role || '').toLowerCase();
  const need = String(roleName).toLowerCase();
  if (have !== need) return res.status(403).json({ error: 'Forbidden' });
  next();
};

auth.requireAnyRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const have = String(req.user.role || '').toLowerCase();
  if (!roles.map(r => String(r).toLowerCase()).includes(have)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

module.exports = auth;
