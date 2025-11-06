const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { setCsrfCookie } = require('../middleware/csrf');
const NODE_ENV = process.env.NODE_ENV || 'development';

const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/schemas');
const usersRepo = require('../src/repositories/userRepo');

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, saId, accountNumber } = req.validated.body;

    const exists = await usersRepo.findByEmail(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await usersRepo.create({
      email,
      password_hash,
      full_name: fullName,
      sa_id: saId,
      account_number: accountNumber
    });

    res.status(201).json({ ok: true, userId: user.user_id });
  } catch (e) { next(e); }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validated.body;
    const user = await usersRepo.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.user_id, role: user.role_name || 'customer' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // auth session cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    // issue CSRF token cookie for double-submit protection
    setCsrfCookie(res);

    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'strict' });
  res.clearCookie('csrfToken', { httpOnly: false, secure: true, sameSite: 'strict' });
  res.json({ ok: true });
});

module.exports = router;
