

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { validate } = require('../middleware/validate');
const { registerSchema, loginSchema } = require('../validation/schemas');

// ✅ correct path to the repo (based on the structure we set up)
const usersRepo = require('../src/repositories/userRepo');

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, fullName, saId, accountNumber } = req.validated.body;

    const exists = await usersRepo.findByEmail(email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);

    // ✅ match the repo's expected field names
    const user = await usersRepo.create({
      email,
      password_hash,
      full_name: fullName,
      sa_id: saId,
      account_number: accountNumber
    });

    return res.status(201).json({ ok: true, userId: user.user_id });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login
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

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,          // requires HTTPS (you’ve got it)
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
