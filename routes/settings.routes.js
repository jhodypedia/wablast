const express = require('express');
const db = require('../lib/db');
const { requireAuth } = require('../lib/authMiddleware');
const { requireRole } = require('../lib/roleMiddleware');
const router = express.Router();

router.get('/admin/settings', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const siteName = (await db.get('SELECT value FROM settings WHERE key=?', ['site_name'])).value;
  const registerEnabled = (await db.get('SELECT value FROM settings WHERE key=?', ['register_enabled'])).value;
  res.render('admin_settings', { title: 'Pengaturan', siteName, registerEnabled });
});

router.post('/admin/settings', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const { site_name, register_enabled } = req.body;
  await db.run('UPDATE settings SET value=? WHERE key="site_name"', [site_name]);
  await db.run('UPDATE settings SET value=? WHERE key="register_enabled"', [register_enabled ? 'true' : 'false']);
  res.redirect('/admin/settings');
});

module.exports = router;
