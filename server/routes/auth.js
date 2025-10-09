const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Temp in-memory “DB” for demo
const users = new Map(); // key: accountNumber
let uidSeq = 1;

// Validations (mirror with frontend)
const reId = /^\d{13}$/;          // SA ID number
const reAccount = /^\d{8,16}$/;   // 8–16 digits

router.post('/register', async (req, res) => {
  try {
    const { name, idNumber, accountNumber, password } = req.body || {};
    if (!name || !reId.test(idNumber) || !reAccount.test(accountNumber) || !password) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    if (users.has(accountNumber)) return res.status(409).json({ error: 'Account exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { id: uidSeq++, name, idNumber, accountNumber, passwordHash };
    users.set(accountNumber, user);

    return res.status(201).json({ ok: true, userId: user.id });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { accountNumber, password } = req.body || {};
    if (!reAccount.test(accountNumber) || !password) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    const user = users.get(accountNumber);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30m' });
    // Secure cookie (works because server is HTTPS)
    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000
    });
    return res.json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

module.exports = router;
