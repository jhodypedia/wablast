const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const bcrypt = require('bcrypt');
const { signToken } = require('../lib/authMiddleware');

router.get('/login', (req, res) => res.render('login', { title: 'Login' }));

router.get('/register', async (req, res) => {
  if (!res.locals.register_enabled) {
    return res.render('register', { title: 'Register', closed: true });
  }
  res.render('register', { title: 'Register', closed: false });
});

router.post('/api/register', async (req, res) => {
  if (!res.locals.register_enabled) {
    return res.status(403).json({ ok: false, message: 'Registrasi ditutup' });
  }
  try {
    const { username, fullname, email, password, role } = req.body;
    if (!username || !fullname || !email || !password)
      return res.status(400).json({ ok: false, message: 'Incomplete' });

    const exists = await db.get('SELECT id FROM users WHERE username=? OR email=?', [username, email]);
    if (exists) return res.status(409).json({ ok: false, message: 'User exists' });

    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
    await db.run(
      'INSERT INTO users (username, fullname, email, password_hash, role) VALUES (?,?,?,?,?)',
      [username, fullname, email, hash, role === 'admin' ? 'admin' : 'member']
    );
    return res.json({ ok: true, message: 'Registered' });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

router.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username=?', [username]);
    if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });
    const passOk = await bcrypt.compare(password, user.password_hash);
    if (!passOk) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

    const token = signToken(user, process.env.JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: false, maxAge: 7*24*3600*1000 });
    return res.json({ ok: true, message: 'Logged in' });
  } catch (e) {
    return res.status(500).json({ ok: false, message: e.message });
  }
});

router.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ ok: true });
});

module.exports = router;
