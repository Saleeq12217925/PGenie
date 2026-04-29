import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { uploadPhotos } from '../middleware/upload.js';
import { auditLog } from '../middleware/auditLogger.js';
import {
  listPGs,
  getPG,
  createPG,
  updatePG,
  deletePG,
  uploadPhotos as uploadPhotosCtrl,
  deletePhoto,
  getMyListings,
} from '../controllers/pgController.js';

const router = Router();

router.get('/', listPGs);
router.get('/owner/mine', verifyToken, requireRole('owner'), getMyListings);
router.get('/:id', getPG);
router.post(
  '/',
  verifyToken,
  requireRole('owner'),
  auditLog('LISTING_CREATED', (req) => ({ title: req.body.title })),
  createPG
);
router.put(
  '/:id',
  verifyToken,
  requireRole('owner'),
  auditLog('LISTING_UPDATED', (req) => ({ listingId: req.params.id, title: req.body.title })),
  updatePG
);
router.delete(
  '/:id',
  verifyToken,
  requireRole('owner'),
  auditLog('LISTING_DELETED', (req) => ({ listingId: req.params.id })),
  deletePG
);
router.post(
  '/:id/photos',
  verifyToken,
  requireRole('owner'),
  uploadPhotos.array('photos', 5),
  uploadPhotosCtrl
);
router.delete('/:id/photos/:filename', verifyToken, requireRole('owner'), deletePhoto);

export default router;
