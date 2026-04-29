import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { createReview, getListingReviews } from '../controllers/reviewController.js';

const router = Router();

router.post('/', verifyToken, requireRole('tenant'), createReview);
router.get('/listing/:listingId', getListingReviews);

export default router;
