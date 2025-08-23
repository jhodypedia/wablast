const jwt = require('jsonwebtoken');
const createError = require('http-errors');

function signToken(user, secret) {
  return jwt.sign(
    { sub: user.id, role: user.role, username: user.username, fullname: user.fullname },
    secret,
    { expiresIn: '7d' }
  );
}

function requireAuth(secret) {
  return (req, res, next) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      if (!token) throw createError(401, 'Unauthenticated');
      req.user = jwt.verify(token, secret);
      res.locals.user = req.user;
      next();
    } catch {
      if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ ok: false, message: 'Unauthorized' });
      }
      return res.redirect('/login');
    }
  };
}

module.exports = { signToken, requireAuth };
