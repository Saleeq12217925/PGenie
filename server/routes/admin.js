import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import {
  listUsers,
  changeUserRole,
  toggleUserActive,
  listAllBookings,
  listAuditLogs,
  getStats,
  getOwnerRevenue,
} from '../controllers/adminController.js';

const router = Router();

// Admin-only routes
router.get('/users', verifyToken, requireRole('admin'), listUsers);
router.patch(
  '/users/:id/toggle-active',
  verifyToken,
  requireRole('admin'),
  auditLog('USER_TOGGLED', (req) => ({ targetUser: req.params.id })),
  toggleUserActive
);
router.patch(
  '/users/:id/role',
  verifyToken,
  requireRole('admin'),
  auditLog('ROLE_CHANGED', (req) => ({ targetUser: req.params.id, newRole: req.body.role })),
  changeUserRole
);
router.get('/bookings', verifyToken, requireRole('admin'), listAllBookings);
router.get('/audit-logs', verifyToken, requireRole('admin'), listAuditLogs);
router.get('/stats', verifyToken, requireRole('admin'), getStats);

// Owner revenue stats (reuse adminController since logic is there)
router.get('/owner-stats', verifyToken, requireRole('owner'), getOwnerRevenue);

export default router;
