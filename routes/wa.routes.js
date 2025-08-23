const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { parse } = require('csv-parse');
const { requireAuth } = require('../lib/authMiddleware');

module.exports = (waHub) => {
  router.post('/api/wa/connect', requireAuth(process.env.JWT_SECRET), async (req, res) => {
    try {
      await waHub.startForUser(req.user.sub);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.post('/api/wa/upload', requireAuth(process.env.JWT_SECRET), upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    let numbers = [];
    try {
      if (req.file.originalname.toLowerCase().endsWith('.csv')) {
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(parse({ delimiter: ',', from_line: 1 }))
            .on('data', row => row.forEach(cell => {
              const num = String(cell || '').replace(/\D/g, '');
              if (num) numbers.push(num);
            }))
            .on('end', resolve)
            .on('error', reject);
        });
      } else {
        const content = fs.readFileSync(filePath, 'utf-8');
        numbers = content.split(/\r?\n|,/).map(v => v.replace(/\D/g,'')).filter(Boolean);
      }
      fs.unlinkSync(filePath);
      return res.json({ ok: true, numbers: Array.from(new Set(numbers)) });
    } catch (e) {
      try { fs.unlinkSync(filePath); } catch {}
      return res.status(500).json({ ok: false, message: e.message });
    }
  });

  router.post('/api/wa/blast', requireAuth(process.env.JWT_SECRET), async (req, res) => {
    try {
      const { numbers = [], message = '' } = req.body;
      if (!Array.isArray(numbers) || !message) return res.status(400).json({ ok: false, message: 'Bad payload' });
      const result = await waHub.sendBlast(req.user.sub, numbers, message);
      return res.json({ ok: true, ...result });
    } catch (e) {
      return res.status(500).json({ ok: false, message: e.message });
    }
  });

  return router;
};
