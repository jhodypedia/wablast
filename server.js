require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const cookieParser = require('cookie-parser');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const logger = require('./lib/logger');
const { loadSettings } = require('./lib/settings');
const { WAHUB } = require('./services/waHub');

// Security & parsers
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Views
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Global settings to views
app.use(loadSettings);

// Socket.io rooms per user for QR/status
io.on('connection', (socket) => {
  const userId = socket.handshake.query.userId;
  if (userId) socket.join(`wa:${userId}`);
});

// Init WA HUB
const waHub = new WAHUB(io);

// Routes
const authRoutes = require('./routes/auth.routes');
const dashRoutes = require('./routes/dashboard.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');
const settingsRoutes = require('./routes/settings.routes');
const exportRoutes = require('./routes/export.routes');
const waRoutesFactory = require('./routes/wa.routes');

app.use(authRoutes);
app.use(dashRoutes);
app.use(adminRoutes);
app.use(userRoutes);
app.use(settingsRoutes);
app.use(exportRoutes);
app.use(waRoutesFactory(waHub));

// 404
app.use((req, res) => res.status(404).render('login', { title: 'Not Found' }));

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
