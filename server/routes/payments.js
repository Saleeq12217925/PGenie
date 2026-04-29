import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import { initiatePayment, confirmPayment } from '../controllers/paymentController.js';

const router = Router();

router.post('/initiate', verifyToken, requireRole('tenant'), initiatePayment);
router.post(
  '/confirm',
  verifyToken,
  requireRole('tenant'),
  auditLog('PAYMENT_CONFIRMED', (req) => ({ bookingId: req.body.bookingId })),
  confirmPayment
);

export default router;
