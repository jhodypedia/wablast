const express = require('express');
const router = express.Router();
const { requireAuth } = require('../lib/authMiddleware');

router.get('/', requireAuth(process.env.JWT_SECRET), (req, res) => {
  res.render('dashboard', { title: 'Dashboard', user: req.user });
});

module.exports = router;
