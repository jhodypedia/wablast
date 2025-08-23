const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode');
const path = require('path');
const logger = require('../lib/logger');

class WAHUB {
  constructor(io) {
    this.io = io;
    this.sockets = new Map();
  }

  async startForUser(userId) {
    if (this.sockets.has(userId)) return this.sockets.get(userId);

    const sessionDir = path.join(process.cwd(), 'sessions', String(userId));
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['WA Blast Web', 'Chrome', '1.0'],
      logger
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      const room = `wa:${userId}`;

      if (qr) {
        const dataUrl = await qrcode.toDataURL(qr);
        this.io.to(room).emit('qr', dataUrl);
      }

      if (connection === 'open') {
        logger.info(`WA connected for user ${userId}`);
        this.io.to(room).emit('ready', 'WhatsApp connected');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        logger.warn({ statusCode }, `WA closed for user ${userId}`);
        this.io.to(room).emit('status', 'Connection closed, retrying…');

        if (statusCode !== DisconnectReason.loggedOut) {
          setTimeout(() => this.startForUser(userId).catch(e=>logger.error(e, 'restart error')), 5000);
        } else {
          logger.error(`WA session logged out for user ${userId}`);
          this.sockets.delete(userId);
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

    this.sockets.set(userId, sock);
    return sock;
  }

  async sendBlast(userId, numbers = [], message = '') {
    const sock = this.sockets.get(userId);
    if (!sock) throw new Error('WA not initialized');
    let ok = 0, fail = 0, logs = [];
    for (const n of numbers) {
      const jid = `${String(n).replace(/\D/g,'')}@s.whatsapp.net`;
      try {
        await sock.sendMessage(jid, { text: message });
        ok++; logs.push({ to: jid, ok: true });
      } catch (e) {
        fail++; logs.push({ to: jid, ok: false, error: e?.message });
      }
      await new Promise(r=>setTimeout(r, 800));
    }

    const db = require('../lib/db');
    await db.run('INSERT INTO stats (user_id, total_sent, created_at) VALUES (?,?,datetime("now"))',
      [userId, ok]);

    logger.info({ userId, ok, fail }, 'Blast finished');
    return { ok, fail, logs };
  }
}

module.exports = { WAHUB };
