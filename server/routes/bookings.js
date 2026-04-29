import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import {
  createBooking,
  getMyBookings,
  getBookingRequests,
  getBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  getChatHistory,
  getUnreadCount,
} from '../controllers/bookingController.js';

const router = Router();

router.post('/', verifyToken, requireRole('tenant'), createBooking);
// Static routes must come before /:id to avoid Express matching them as an id param
router.get('/mine', verifyToken, requireRole('tenant'), getMyBookings);
router.get('/requests', verifyToken, requireRole('owner'), getBookingRequests);
router.get('/unread-count', verifyToken, getUnreadCount);
router.get('/chat/:bookingId', verifyToken, getChatHistory);
// Dynamic routes last
router.get('/:id', verifyToken, getBooking);
router.patch(
  '/:id/approve',
  verifyToken,
  requireRole('owner'),
  auditLog('BOOKING_APPROVED', (req) => ({ bookingId: req.params.id })),
  approveBooking
);
router.patch(
  '/:id/reject',
  verifyToken,
  requireRole('owner'),
  auditLog('BOOKING_REJECTED', (req) => ({ bookingId: req.params.id })),
  rejectBooking
);
router.patch(
  '/:id/cancel',
  verifyToken,
  requireRole('tenant'),
  auditLog('BOOKING_CANCELLED', (req) => ({ bookingId: req.params.id })),
  cancelBooking
);
router.patch(
  '/:id/complete',
  verifyToken,
  requireRole('owner'),
  auditLog('BOOKING_COMPLETED', (req) => ({ bookingId: req.params.id })),
  completeBooking
);

export default router;
