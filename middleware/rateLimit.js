const rateLimit = require('express-rate-limit');

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000; // 15 min
const maxLogin = parseInt(process.env.RATE_LIMIT_MAX_LOGIN, 10) || 10;

const loginLimiter = rateLimit({
  windowMs,
  max: maxLogin,
  message: { error: 'Too many login attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { loginLimiter };
