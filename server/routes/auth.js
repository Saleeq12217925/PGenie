import { Router } from 'express';
import { body } from 'express-validator';
import { authLimiter, loginLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { verifyToken } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import { register, login, me, updateProfile, refresh, logout } from '../controllers/authController.js';

const router = Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required.').isLength({ max: 100 }).withMessage('Name too long.'),
  body('email').isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain a number.'),
  body('role').optional().isIn(['owner', 'tenant']).withMessage('Invalid role.'),
];

const loginValidation = [
  body('email').isEmail().withMessage('Valid email required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
];

router.post(
  '/register',
  authLimiter,
  registerValidation,
  validate,
  auditLog('REGISTER', (req) => ({ email: req.body.email })),
  register,
);

router.post(
  '/login',
  authLimiter,
  loginLimiter,
  loginValidation,
  validate,
  auditLog('LOGIN_ATTEMPT', (req) => ({ email: req.body.email })),
  login,
);

router.get('/me', verifyToken, me);

router.post('/refresh', authLimiter, auditLog('TOKEN_REFRESH'), refresh);

router.patch(
  '/profile',
  verifyToken,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.').isLength({ max: 100 }).withMessage('Name too long.'),
    body('currentPassword').optional(),
    body('newPassword').optional()
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/).withMessage('Password must contain a number.'),
  ],
  validate,
  auditLog('PROFILE_UPDATE'),
  updateProfile,
);

router.post('/logout', verifyToken, auditLog('LOGOUT'), logout);

export default router;
