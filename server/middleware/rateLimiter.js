import rateLimit from 'express-rate-limit';

const handler = (_req, res) => {
  res.status(429).json({ success: false, message: 'Too many requests, please try again later.' });
};

const isProd = process.env.NODE_ENV === 'production';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

export const mfaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: isProd ? 5 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});
