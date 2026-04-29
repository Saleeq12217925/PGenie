import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { predictRent, getRecommendations } from '../controllers/aiProxyController.js';

const router = Router();

router.post('/predict-rent', verifyToken, requireRole('owner'), predictRent);
router.get('/recommendations', verifyToken, requireRole('tenant'), getRecommendations);

export default router;
