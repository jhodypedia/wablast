const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../lib/db');
const { requireAuth } = require('../lib/authMiddleware');
const { requireRole } = require('../lib/roleMiddleware');
const router = express.Router();

router.get('/admin/users', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const users = await db.all('SELECT id, username, fullname, email, role, created_at FROM users ORDER BY id DESC');
  res.render('admin_users', { title: 'Manajemen User', users, user: req.user });
});

router.get('/admin/users/new', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), (req, res) => {
  res.render('admin_user_form', { title: 'Tambah User', user: req.user, form: {} });
});

router.post('/admin/users/new', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const { username, fullname, email, password, role } = req.body;
  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
  await db.run('INSERT INTO users (username, fullname, email, password_hash, role) VALUES (?,?,?,?,?)',
    [username, fullname, email, hash, role === 'admin' ? 'admin' : 'member']);
  res.redirect('/admin/users');
});

router.get('/admin/users/:id/edit', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const form = await db.get('SELECT * FROM users WHERE id=?', [req.params.id]);
  res.render('admin_user_form', { title: 'Edit User', user: req.user, form });
});

router.post('/admin/users/:id/edit', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const { fullname, email, role, password } = req.body;
  if (password) {
    const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 10));
    await db.run('UPDATE users SET fullname=?, email=?, role=?, password_hash=? WHERE id=?',
      [fullname, email, role, hash, req.params.id]);
  } else {
    await db.run('UPDATE users SET fullname=?, email=?, role=? WHERE id=?',
      [fullname, email, role, req.params.id]);
  }
  res.redirect('/admin/users');
});

router.post('/admin/users/:id/delete', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
  res.redirect('/admin/users');
});

module.exports = router;
