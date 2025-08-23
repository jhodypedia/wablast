const express = require('express');
const router = express.Router();
const db = require('../lib/db');
const XLSX = require('xlsx');
const { requireAuth } = require('../lib/authMiddleware');
const { requireRole } = require('../lib/roleMiddleware');

function toCSV(rows) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = v => `"${String(v ?? '').replace(/"/g,'""')}"`;
  return [ headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(',')) ].join('\n');
}
function toXLSXBuffer(rows, sheetName='Sheet1') {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  return XLSX.write(wb, { type:'buffer', bookType:'xlsx' });
}

router.get('/admin/export/users.csv', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (_req, res) => {
  const rows = await db.all('SELECT id, username, fullname, email, role, created_at FROM users ORDER BY id ASC');
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="users.csv"');
  res.send(toCSV(rows));
});
router.get('/admin/export/users.xlsx', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (_req, res) => {
  const rows = await db.all('SELECT id, username, fullname, email, role, created_at FROM users ORDER BY id ASC');
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename="users.xlsx"');
  res.send(toXLSXBuffer(rows, 'Users'));
});

router.get('/admin/export/stats.csv', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (_req, res) => {
  const rows = await db.all(`
    SELECT s.id, s.user_id, u.username, u.fullname, s.total_sent, s.created_at
    FROM stats s JOIN users u ON u.id=s.user_id ORDER BY s.created_at DESC
  `);
  res.setHeader('Content-Type','text/csv');
  res.setHeader('Content-Disposition','attachment; filename="stats.csv"');
  res.send(toCSV(rows));
});
router.get('/admin/export/stats.xlsx', requireAuth(process.env.JWT_SECRET), requireRole(['admin']), async (_req, res) => {
  const rows = await db.all(`
    SELECT s.id, s.user_id, u.username, u.fullname, s.total_sent, s.created_at
    FROM stats s JOIN users u ON u.id=s.user_id ORDER BY s.created_at DESC
  `);
  res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition','attachment; filename="stats.xlsx"');
  res.send(toXLSXBuffer(rows, 'Stats'));
});

module.exports = router;
