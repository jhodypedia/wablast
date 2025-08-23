const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const { requireAuth } = require('../lib/authMiddleware');
const { requireRole } = require('../lib/roleMiddleware');

router.get('/admin', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (req, res) => {
  const totalUsers = (await db.get('SELECT COUNT(*) as c FROM users')).c;
  const totalSent = (await db.get('SELECT COALESCE(SUM(total_sent),0) as s FROM stats')).s || 0;
  const logs = await db.all(`
    SELECT s.id, u.username, u.fullname, s.total_sent, s.created_at
    FROM stats s JOIN users u ON u.id = s.user_id
    ORDER BY s.created_at DESC LIMIT 20
  `);
  const chartData = await db.all(`
    SELECT DATE(created_at) as day, SUM(total_sent) as sent
    FROM stats GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC
  `);
  res.render('admin_dashboard', {
    title: 'Admin Dashboard',
    user: req.user, totalUsers, totalSent, logs, chartData
  });
});

module.exports = router;
