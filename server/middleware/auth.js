const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  try {
    // Prefer secure HttpOnly cookie; allow Bearer for testing
    const cookie = req.cookies?.token;
    const header = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = cookie || header;
    if (!token) return res.status(401).json({ error: 'Auth required' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid/expired token' });
  }
};
