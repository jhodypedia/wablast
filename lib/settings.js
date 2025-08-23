const db = require('./db');

async function loadSettings(req, res, next) {
  const rows = await db.all('SELECT key, value FROM settings');
  const kv = {};
  rows.forEach(r => kv[r.key] = r.value);
  req.settings = kv;
  res.locals.site_name = kv.site_name || 'WA Blast';
  res.locals.register_enabled = (kv.register_enabled || 'true') === 'true';
  next();
}

module.exports = { loadSettings };
